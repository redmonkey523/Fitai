const Media = require('../models/Media');

function startUploadCleanupJob() {
  const enabled = process.env.ENABLE_UPLOAD_CLEANUP !== 'false';
  if (!enabled) return;
  const dayMs = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - 7 * dayMs);
      await Media.deleteMany({ deleted: true, updatedAt: { $lte: cutoff } });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Cleanup job failed:', e?.message);
    }
  }, dayMs);
}

module.exports = { startUploadCleanupJob };


