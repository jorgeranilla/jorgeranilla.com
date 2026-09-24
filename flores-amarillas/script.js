(function () {
    var openButton = document.getElementById("open-envelope");
    var petalLayer = document.getElementById("petal-layer");
    var opened = false;
    var audioContext = null;
    var masterGain = null;
    var melodyTimer = null;
    var melodyNotes = [
        { frequency: 329.63, start: 0, duration: 0.58 },
        { frequency: 392.00, start: 0.58, duration: 0.58 },
        { frequency: 493.88, start: 1.16, duration: 0.92 },
        { frequency: 440.00, start: 2.08, duration: 0.58 },
        { frequency: 392.00, start: 2.66, duration: 0.7 },
        { frequency: 349.23, start: 3.48, duration: 0.58 },
        { frequency: 392.00, start: 4.06, duration: 0.58 },
        { frequency: 523.25, start: 4.64, duration: 1.1 },
        { frequency: 493.88, start: 5.86, duration: 0.58 },
        { frequency: 440.00, start: 6.44, duration: 0.58 },
        { frequency: 392.00, start: 7.02, duration: 1.15 }
    ];

    function openGift() {
        if (opened) {
            return;
        }

        opened = true;
        document.body.classList.add("opened");
        openButton.setAttribute("aria-expanded", "true");
        releasePetals();
        startMelody();
    }

    function releasePetals() {
        if (!petalLayer) {
            return;
        }

        var total = window.matchMedia("(max-width: 680px)").matches ? 28 : 42;
        for (var i = 0; i < total; i += 1) {
            var petal = document.createElement("span");
            var left = Math.round(Math.random() * 100);
            var drift = Math.round((Math.random() * 220) - 110);
            var duration = (4.8 + Math.random() * 3.2).toFixed(2) + "s";
            var delay = (Math.random() * 1.3).toFixed(2) + "s";

            petal.className = "petal";
            petal.style.left = left + "vw";
            petal.style.setProperty("--drift", drift + "px");
            petal.style.setProperty("--duration", duration);
            petal.style.setProperty("--delay", delay);
            petalLayer.appendChild(petal);
        }

        window.setTimeout(function () {
            petalLayer.textContent = "";
        }, 9200);
    }

    function startMelody() {
        var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextConstructor || melodyTimer) {
            return;
        }

        audioContext = audioContext || new AudioContextConstructor();
        masterGain = audioContext.createGain();
        masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.075, audioContext.currentTime + 1.2);
        masterGain.connect(audioContext.destination);

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        playMelodyPhrase();
        melodyTimer = window.setInterval(playMelodyPhrase, 9200);
    }

    function playMelodyPhrase() {
        var now = audioContext.currentTime + 0.08;

        melodyNotes.forEach(function (note, index) {
            playTone(note.frequency, now + note.start, note.duration, index % 3 === 0 ? 0.034 : 0.026);
            if (index % 2 === 0) {
                playTone(note.frequency / 2, now + note.start, note.duration + 0.16, 0.014);
            }
        });
    }

    function playTone(frequency, startTime, duration, volume) {
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var endTime = startTime + duration;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start(startTime);
        oscillator.stop(endTime + 0.06);
    }

    if (openButton) {
        openButton.addEventListener("click", openGift);
    }
}());
