import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import '/src/images/Sound_Enabled.png';
import '/src/images/Sound_Disabled.png';
import '/src/images/background.jpg';
import '/src/images/Logo.svg';
import '/src/pages/Game.txt';

// Attach event listener to the Sound button, and the Play button.
document.getElementById('ToggleSoundButton').addEventListener('click', ToggleSound);
document.getElementById('PlayButton').addEventListener('click', LoadGame);
object.onclick = function(){LoadCredits};

function ToggleSound() {
    const SoundState = document.getElementById('SoundState');
    const SoundState1 = '/src/images/Sound_Enabled.png'; // Path to the Sound Enabled image
    const SoundState2 = '/src/images/Sound_Disabled.png'; // Path to the Sound Disabled image
  
    // Switch the sound image source
    SoundState.src = SoundState.src.endsWith(SoundState1) ? SoundState2 : SoundState1;
}

function LoadGame() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("Content").innerHTML =
       this.responseText;
      }
    };
  xhttp.open("GET", "/src/pages/Game.txt", true);
  xhttp.send();
}

function LoadCredits() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("Content").innerHTML =
      this.responseText;
    }
  };
  xhttp.open("GET", "/src/pages/Credits.txt", true);
  xhttp.send();
}