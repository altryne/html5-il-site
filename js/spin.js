/*
 requestAnimationFrame polyfill
 */
(function (w) {
    var lastTime = 0,
        vendors = ['webkit', /*'moz',*/ 'o', 'ms'];
    for (var i = 0; i < vendors.length && !w.requestAnimationFrame; ++i) {
        w.requestAnimationFrame = w[vendors[i] + 'RequestAnimationFrame'];
        w.cancelAnimationFrame = w[vendors[i] + 'CancelAnimationFrame']
            || w[vendors[i] + 'CancelRequestAnimationFrame'];
    }

    if (!w.requestAnimationFrame)
        w.requestAnimationFrame = function (callback, element) {
            var currTime = +new Date(),
                timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                id = w.setTimeout(function () {
                    callback(currTime + timeToCall)
                }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!w.cancelAnimationFrame)
        w.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
})(this);

/*
 Slot Machine
 */
var sm = (function (undefined) {

    var tMax = 2000, // animation time, ms
        height = 800,
        speeds = [],
        r = [],
        reels = [
            ['coffee maker', 'teapot', 'espresso machine'],
            ['coffee filter', 'tea strainer', 'espresso tamper'],
            ['coffee grounds', 'loose tea', 'ground espresso beans']
        ],
        $reels, $msg,
        start;

    function init() {
        $reels = $('.reel').each(function (i, el) {
            el.innerHTML = '<div><p>' + reels[i].join('</p><p>') + '</p></div><div><p>' + reels[i].join('</p><p>') + '</p></div>'
        });

        $msg = $('.msg');

        $('button').click(action);
    }

    function action() {
        if (start !== undefined) return;
        number  = $('.reel').eq(0).find('div').eq(0).find('p').length
        height = number * 60;
        for (var i = 0; i < $('.reel').length; ++i) {
            speeds[i] = Math.random() + .5;
            r[i] = (Math.random() * number | 0) * height / number;
        }

        animate();
    }

    function animate(now) {
        $reels = $('.reel');
        height = number * 60;
        if (!start) start = now;
        var t = now - start || 0;

        for (var i = 0; i < $reels.length; ++i)
            $reels[i].scrollTop = (speeds[i] / tMax / 2 * (tMax - t) * (tMax - t) + r[i]) % height | 0;

        if (t < tMax)
            requestAnimationFrame(animate);
        else {
            start = undefined;
            check();
        }
    }

    function check() {

    }

    return {init: init,animate: animate, action: action}

})();
