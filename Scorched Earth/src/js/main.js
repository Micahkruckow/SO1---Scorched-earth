import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import '/src/images/Sound_Enabled.png';
import '/src/images/Sound_Disabled.png';

// Attach event listener to the button
document.getElementById('ToggleSoundButton').addEventListener('click', ToggleSound);

function ToggleSound() {
    const SoundState = document.getElementById('SoundState');
    const SoundState1 = '/src/images/Sound_Enabled.png'; // Path to the first image
    const SoundState2 = '/src/images/Sound_Disabled.png'; // Path to the second image
  
    // Switch image source
    SoundState.src = SoundState.src.endsWith(SoundState1) ? SoundState2 : SoundState1;
  }
  