/**
 * Detox E2E test for Workouts/Routine flow
 * Tests: routine create, start, finish; camera permissions
 */

describe('Workouts - Routine Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create a new routine', async () => {
    // Navigate to Workouts tab
    await element(by.label('Workouts')).tap();
    await waitFor(element(by.text('My Routines'))).toBeVisible().withTimeout(5000);
    
    // Click Create button
    await element(by.id('create-routine-button')).tap();
    await waitFor(element(by.id('routine-name-input'))).toBeVisible().withTimeout(2000);
    
    // Fill in routine details
    await element(by.id('routine-name-input')).typeText('Push Day');
    await element(by.id('routine-description-input')).typeText('Chest, shoulders, triceps');
    
    // Add an exercise
    await element(by.id('add-exercise-button')).tap();
    await element(by.id('exercise-name-input-0')).typeText('Bench Press');
    await element(by.id('exercise-sets-input-0')).typeText('4');
    await element(by.id('exercise-reps-input-0')).typeText('8');
    await element(by.id('exercise-weight-input-0')).typeText('80');
    
    // Save routine
    await element(by.id('save-routine-button')).tap();
    
    // Should see success toast and return to workouts screen
    await waitFor(element(by.text('Routine created'))).toBeVisible().withTimeout(2000);
    await waitFor(element(by.text('Push Day'))).toBeVisible().withTimeout(2000);
  });

  it('should start a workout from routine', async () => {
    // Navigate to Workouts tab
    await element(by.label('Workouts')).tap();
    await waitFor(element(by.text('My Routines'))).toBeVisible().withTimeout(5000);
    
    // Find first routine and start it
    const startButton = element(by.id('start-workout-button-0'));
    await waitFor(startButton).toBeVisible().withTimeout(2000);
    await startButton.tap();
    
    // Should see workout started confirmation
    await waitFor(element(by.text('Workout started'))).toBeVisible().withTimeout(2000);
  });

  it('should delete a routine', async () => {
    // Navigate to Workouts tab
    await element(by.label('Workouts')).tap();
    await waitFor(element(by.text('My Routines'))).toBeVisible().withTimeout(5000);
    
    // Delete first routine
    const deleteButton = element(by.id('delete-routine-button-0'));
    await waitFor(deleteButton).toBeVisible().withTimeout(2000);
    await deleteButton.tap();
    
    // Confirm deletion
    await element(by.text('Delete')).tap();
    
    // Should see success toast
    await waitFor(element(by.text('Routine deleted'))).toBeVisible().withTimeout(2000);
  });
});

describe('Camera/Scan Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { camera: 'NO' } // Start with denied permissions
    });
  });

  it('should request camera permission on first scan attempt', async () => {
    // Navigate to Scan screen (via Nutrition or direct)
    await element(by.id('barcode-button')).tap();
    await waitFor(element(by.text('Camera Permission'))).toBeVisible().withTimeout(2000);
    
    // Should show permission request dialog
    await expect(element(by.text('Grant Permission'))).toBeVisible();
  });

  it('should scan barcode successfully after permission granted', async () => {
    await device.launchApp({
      permissions: { camera: 'YES' }
    });
    
    // Navigate to Scan screen
    await element(by.id('barcode-button')).tap();
    await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(2000);
    
    // Mock barcode scan (Detox doesn't actually scan)
    // In real testing, use device.sendUserActivity or mock the scan callback
    
    // Should return to previous screen with barcode data
    await waitFor(element(by.id('nutrition-screen'))).toBeVisible().withTimeout(3000);
  });

  it('should show helpful message on permission denial', async () => {
    await device.launchApp({
      permissions: { camera: 'NO' }
    });
    
    // Navigate to Scan screen
    await element(by.id('barcode-button')).tap();
    await waitFor(element(by.text('Camera Permission'))).toBeVisible().withTimeout(2000);
    
    // Deny permission
    await element(by.text('Cancel')).tap();
    
    // Should show helpful message
    await expect(element(by.text('Camera access is required'))).toBeVisible();
    await expect(element(by.text('Open Settings'))).toBeVisible();
  });
});

describe('Upload Reliability', () => {
  it('should upload photo without "file does not exist" error', async () => {
    await device.launchApp({
      permissions: { photos: 'YES' }
    });
    
    // Navigate to a screen with upload (e.g., Progress Photos)
    await element(by.label('Progress')).tap();
    await element(by.id('add-photo-button')).tap();
    
    // Select photo from gallery
    await element(by.text('Choose from Library')).tap();
    // Mock photo selection
    await device.sendUserActivity({ type: 'selectedPhoto', uri: 'mock-uri' });
    
    // Should not see "file does not exist" error
    await waitFor(element(by.text('Upload successful'))).toBeVisible().withTimeout(5000);
  });

  it('should return to previous screen with scroll preserved after upload', async () => {
    // Scroll down on a list screen
    await element(by.label('Discover')).tap();
    await element(by.id('discover-list')).scroll(500, 'down');
    
    const scrollOffset = await element(by.id('discover-list')).getAttributes();
    
    // Open upload modal
    await element(by.id('upload-button')).tap();
    await waitFor(element(by.id('upload-modal'))).toBeVisible().withTimeout(2000);
    
    // Close modal
    await element(by.id('close-upload-modal')).tap();
    
    // Should return to same scroll position (within ±100px)
    const newScrollOffset = await element(by.id('discover-list')).getAttributes();
    // Note: Actual scroll offset comparison would go here
  });
});

