import { EventEmitter } from 'events';
import api from './api';

/**
 * Upload Queue Service
 * Manages file uploads with retry logic, progress tracking, and queue management
 * 
 * Features:
 * - Queue management with priority
 * - Automatic retry with exponential backoff
 * - Progress tracking per file
 * - Cancellation support
 * - Pre-upload validation
 */

class UploadQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = []; // Array of upload jobs
    this.active = new Map(); // Map of jobId -> { cancel, promise }
    this.maxConcurrent = 3;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // ms, will use exponential backoff
  }

  /**
   * Validate file before adding to queue
   * @param {Object} file - File object with uri, name, type, size, duration
   * @param {Object} options - Validation options
   * @returns {Object} { valid: boolean, error: string }
   */
  validateFile(file, options = {}) {
    const {
      maxSizeMB = 200,
      maxDurationSec = 300, // 5 minutes
      allowedTypes = ['image', 'video'],
    } = options;

    // Check file exists
    if (!file || !file.uri) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    const fileType = (file.type || '').toLowerCase();
    const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || '');
    const isVideo = fileType.includes('video') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name || '');
    
    if (!isImage && !isVideo) {
      return { valid: false, error: 'Only image and video files are allowed' };
    }

    if (allowedTypes.includes('image') && !allowedTypes.includes('video') && !isImage) {
      return { valid: false, error: 'Only images are allowed' };
    }

    if (allowedTypes.includes('video') && !allowedTypes.includes('image') && !isVideo) {
      return { valid: false, error: 'Only videos are allowed' };
    }

    // Check file size
    if (file.size) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        return { valid: false, error: `File too large (${sizeMB.toFixed(1)}MB). Max: ${maxSizeMB}MB` };
      }
    }

    // Check video duration
    if (isVideo && file.duration && maxDurationSec) {
      if (file.duration > maxDurationSec) {
        const mins = Math.floor(file.duration / 60);
        const maxMins = Math.floor(maxDurationSec / 60);
        return { valid: false, error: `Video too long (${mins}min). Max: ${maxMins}min` };
      }
    }

    return { valid: true };
  }

  /**
   * Add file to upload queue
   * @param {Object} file - File object
   * @param {Object} options - Upload options
   * @returns {string} jobId
   */
  addToQueue(file, options = {}) {
    const jobId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      file,
      options,
      status: 'queued', // queued, uploading, completed, failed, cancelled
      progress: 0,
      attempts: 0,
      error: null,
      result: null,
      priority: options.priority || 0, // Higher priority uploads first
      createdAt: Date.now(),
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority); // Sort by priority

    this.emit('queue_updated', { queue: this.getQueue() });
    this.emit('job_added', { jobId, file });

    // Start processing queue
    this._processQueue();

    return jobId;
  }

  /**
   * Cancel upload job
   * @param {string} jobId
   */
  cancelUpload(jobId) {
    // Cancel active upload
    const activeJob = this.active.get(jobId);
    if (activeJob && activeJob.cancel) {
      activeJob.cancel();
      this.active.delete(jobId);
    }

    // Update job status in queue
    const job = this.queue.find(j => j.id === jobId);
    if (job) {
      job.status = 'cancelled';
      job.error = 'Cancelled by user';
      this.emit('job_cancelled', { jobId });
      this.emit('queue_updated', { queue: this.getQueue() });
    }
  }

  /**
   * Retry failed upload
   * @param {string} jobId
   */
  retryUpload(jobId) {
    const job = this.queue.find(j => j.id === jobId);
    if (job && (job.status === 'failed' || job.status === 'cancelled')) {
      job.status = 'queued';
      job.attempts = 0;
      job.error = null;
      job.progress = 0;
      
      this.emit('job_retry', { jobId });
      this.emit('queue_updated', { queue: this.getQueue() });
      
      this._processQueue();
    }
  }

  /**
   * Get current queue state
   * @returns {Array} Queue jobs
   */
  getQueue() {
    return this.queue.map(job => ({
      id: job.id,
      fileName: job.file.name || 'Unknown',
      status: job.status,
      progress: job.progress,
      error: job.error,
      attempts: job.attempts,
      result: job.result,
    }));
  }

  /**
   * Get specific job
   * @param {string} jobId
   * @returns {Object} Job object
   */
  getJob(jobId) {
    return this.queue.find(j => j.id === jobId);
  }

  /**
   * Clear completed/failed jobs from queue
   */
  clearCompleted() {
    const before = this.queue.length;
    this.queue = this.queue.filter(j => 
      j.status !== 'completed' && j.status !== 'failed' && j.status !== 'cancelled'
    );
    const after = this.queue.length;
    
    if (before !== after) {
      this.emit('queue_updated', { queue: this.getQueue() });
    }
  }

  /**
   * Process upload queue
   * @private
   */
  async _processQueue() {
    // Get pending jobs
    const pending = this.queue.filter(j => j.status === 'queued');
    
    // Check if we can start more uploads
    const activeCount = this.active.size;
    const available = this.maxConcurrent - activeCount;
    
    if (available <= 0 || pending.length === 0) {
      return;
    }

    // Start uploads up to max concurrent
    const toStart = pending.slice(0, available);
    
    for (const job of toStart) {
      this._uploadJob(job);
    }
  }

  /**
   * Upload a single job with retry logic
   * @private
   */
  async _uploadJob(job) {
    job.status = 'uploading';
    job.attempts += 1;
    
    this.emit('job_started', { jobId: job.id });
    this.emit('queue_updated', { queue: this.getQueue() });

    try {
      // Create cancellable upload
      const { promise, cancel } = api.uploadFileWithProgressCancellable(
        job.file,
        'file',
        (progress) => {
          job.progress = progress;
          this.emit('job_progress', { jobId: job.id, progress });
          this.emit('queue_updated', { queue: this.getQueue() });
        }
      );

      // Track active upload
      this.active.set(job.id, { cancel, promise });

      // Wait for upload to complete
      const result = await promise;
      
      // Remove from active
      this.active.delete(job.id);

      // Update job status
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.error = null;

      this.emit('job_completed', { jobId: job.id, result });
      this.emit('queue_updated', { queue: this.getQueue() });

      // Process next in queue
      this._processQueue();

    } catch (error) {
      // Remove from active
      this.active.delete(job.id);

      // Check if should retry
      if (job.attempts < this.retryAttempts && error.message !== 'Cancelled') {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, job.attempts - 1);
        
        console.log(`[UploadQueue] Retrying job ${job.id} in ${delay}ms (attempt ${job.attempts + 1}/${this.retryAttempts})`);
        
        job.status = 'queued';
        job.error = `Retrying... (${error.message})`;
        
        this.emit('job_retry', { jobId: job.id, attempt: job.attempts + 1, delay });
        this.emit('queue_updated', { queue: this.getQueue() });

        setTimeout(() => {
          this._processQueue();
        }, delay);

      } else {
        // Max retries reached or cancelled
        job.status = error.message === 'Cancelled' ? 'cancelled' : 'failed';
        job.error = error.message || 'Upload failed';
        job.progress = 0;

        this.emit('job_failed', { jobId: job.id, error: job.error });
        this.emit('queue_updated', { queue: this.getQueue() });

        // Process next in queue
        this._processQueue();
      }
    }
  }
}

// Singleton instance
const uploadQueue = new UploadQueue();

export default uploadQueue;





