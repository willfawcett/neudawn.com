/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = ['track', 'extra', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = '';
  timer.innerHTML = '';
  duration.innerHTML = '';

  // Setup the playlist display.
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['./audio/' + data.file + '.webm', './audio/' + data.file + '.mp3'],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          self.skip('next');
        },
        onpause: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onseek: function() {
          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    //track.innerHTML = (index + 1) + '. ' + data.title;
    track.innerHTML =  data.title;
    
    $('#extra .info').hide();
    $('#extra .installation').fadeIn();
    
    $('#extra .installation .number').html(data.number ? 'NUMBER ' + data.number : '');
    $('#extra .installation .model').html(data.model || '');
    $('#extra .installation .designer').html(data.designer || '');
    $('#extra .installation .artist').html(data.artist || '');
    $('#extra .installation .note').html(data.note || '');
    
    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([
  {
    title: 'I',
    number: '1',
    model: 'Abby Yankle',
    designer: 'Julia Liller',
    artist: 'Jessica Maples',
    note: '',
    file: '01 - ND13',
    howl: null
  },
  {
    title: 'II',
    number: '2',
    model: 'Jalisa Ambrose',
    designer: 'A.J. Tompkins',
    artist: 'Conz8000',
    note: '',
    file: '02 - ND18',
    howl: null
  },
  {
    title: 'III',
    number: '3',
    model: 'N/A',
    designer: 'Miranda Pixley',
    artist: 'Molly Holmes',
    note: 'This installation is blank due to life changes for both artist and costumer to where they did not have freedom to create.',
    file: '03 - ND08',
    howl: null
  },
  {
    title: 'IV',
    number: '4',
    model: 'Ellis Jayne',
    designer: 'Sunè Van Rooyen Phillips',
    artist: 'Sunè Van Rooyen Phillips',
    note: '',
    file: '04 - ND04',
    howl: null
  },
  {
    title: 'V',
    number: '5',
    model: 'Rachel Stringfellow',
    designer: 'Rachel Stringfellow',
    artist: 'Rachel Stringfellow',
    note: '',
    file: '05 - ND03',
    howl: null
  },
  {
    title: 'VI',
    number: '6',
    model: 'Lillian McKinney',
    designer: 'Lillian McKinney',
    artist: 'Lucy Gafford',
    note: '',
    file: '06 - ND07',
    howl: null
  },
  {
    title: 'VII',
    number: '7',
    model: 'Nicole Decker',
    designer: 'Sarah Bohnenstiehl',
    artist: 'Dena Kollins',
    note: '',
    file: '07 - ND02',
    howl: null
  },
  {
    title: 'VIII',
    number: '8',
    model: 'Laura Scott',
    designer: 'Courtney Matthews',
    artist: 'Ryan Jetten',
    note: '',
    file: '08 - ND09',
    howl: null
  },
  {
    title: 'IX',
    number: '9',
    model: 'Reginald Davis',
    designer: 'Antionette Warbington',
    artist: '',
    note: 'Sol Davis could not be in the show due to work.',
    file: '09 - ND16',
    howl: null
  },
  {
    title: 'X',
    number: '10',
    model: 'April Patrick',
    designer: 'April Patrick',
    artist: 'Artist Name',
    note: '',
    file: '10 - ND06',
    howl: null
  },
  {
    title: 'XI',
    number: '11',
    model: 'April Livingston',
    designer: 'April Livingston',
    artist: 'Amanada Youngblood',
    note: '',
    file: '11 - ND10',
    howl: null
  },
  {
    title: 'XII',
    number: '12',
    model: 'Stallworth',
    designer: 'Stallworth',
    artist: 'Brandin Stallworth',
    note: '',
    file: '12 - ND11',
    howl: null
  },
  {
    title: 'XIII',
    number: '13',
    model: 'Suzette Callahan',
    designer: 'Suzette Callahan',
    artist: 'Randy Jennings',
    note: '',
    file: '13 - ND19',
    howl: null
  },
  {
    title: 'XIV',
    number: '14',
    model: 'Marnèe Wiley',
    designer: 'Valerie Iliff',
    artist: 'Chris Murray',
    note: '',
    file: '14 - ND05',
    howl: null
  },
  {
    title: 'XV',
    number: '15',
    model: 'Larrah Craig',
    designer: 'Laura Compton',
    artist: 'Marnèe Wiley',
    note: '',
    file: '15 - ND17',
    howl: null
  },
  {
    title: 'XVI',
    number: '16',
    model: 'McKenzie Wallace',
    designer: 'Jessica Price',
    artist: 'Mateo',
    note: '',
    file: '16 - ND01',
    howl: null
  },
  {
    title: 'XVII',
    number: '17',
    model: 'Emily Howat',
    designer: 'Richard McGill-Hamilton',
    artist: 'Taylor Shaw',
    note: '',
    file: '17 - ND05',
    howl: null
  },
  {
    title: 'XVIII',
    number: '18',
    model: 'Debbie Richards',
    designer: 'Debbie Richards',
    artist: 'Katrina Breland',
    note: '',
    file: '18 - ND15',
    howl: null
  },
  {
    title: 'XIX',
    number: '19',
    model: 'Sarah Hoeb',
    designer: 'Sara Thompson',
    artist: 'Sarah Gelsinger Brewer',
    note: '',
    file: '19 - ND17',
    howl: null
  },
  {
    title: 'XX',
    number: '20',
    model: 'Jessica Price',
    designer: 'Jessica Price',
    artist: 'Jessica Price',
    note: '',
    file: '20 - ND12',
    howl: null
  }
]);

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.02,
  amplitude: 0.7,
  frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();
