import { ttsService } from '../services/tts-service';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function testTTSService() {
  try {
    console.log('Testing TTS service...');
    const testText = 'Strike three! The batter is out. What a fantastic pitch!';
    
    console.log('Generating speech for:', testText);
    const audioBuffer = await ttsService.generateSpeech(testText);
    
    // Save the audio file for testing
    const outputPath = join(__dirname, 'test-output.mp3');
    await writeFile(outputPath, Buffer.from(audioBuffer));
    console.log('Audio file saved to:', outputPath);

    console.log('\nTTS service test completed successfully');
  } catch (error) {
    console.error('Error testing TTS service:', error);
  }
}

// Run the test
testTTSService(); 