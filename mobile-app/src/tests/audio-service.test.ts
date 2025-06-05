import { audioService } from '../services/audio-service';

async function testAudioService() {
  try {
    console.log('Testing audio service...');

    // Test audio URLs (these should be replaced with actual test audio files)
    const testAudios = [
      'https://example.com/test-audio-1.mp3',
      'https://example.com/test-audio-2.mp3',
    ];

    console.log('Adding audio files to queue...');
    for (const url of testAudios) {
      await audioService.addToQueue(url, () => {
        console.log(`Finished playing: ${url}`);
      });
    }

    // Wait for a bit to let audio play
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Testing pause...');
    await audioService.pause();
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing resume...');
    await audioService.resume();
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing stop...');
    await audioService.stop();

    console.log('\nAudio service test completed successfully');
  } catch (error) {
    console.error('Error testing audio service:', error);
  }
}

// Run the test
testAudioService(); 