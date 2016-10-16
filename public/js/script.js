$(document).ready(function(){

    /* Defines */
    window.previewWindowWidth = 1280;

    window.isTouchDevice = 'ontouchstart' in document.documentElement;
    if(window.isTouchDevice){
        window.previewWindowWidth *= window.devicePixelRatio - 0.75;
        $('body').addClass('touchscreen');
    }

    /* START Боковое меню */
    $('a.button-menu-open').click(function() {
        if($(this).hasClass('active')){
            $('a.button-menu-open, .aside, .overlay').removeClass('active');
            $('html').removeClass('overlay-active');
        }
        else{
            $('a.button-menu-open, .aside, .overlay').addClass('active');
            $('html').addClass('overlay-active');
        }
        return false;
    });
    $('.menu-button-close, .overlay').click(function() {
        if($('.overlay').hasClass('active')){
            $('a.button-menu-open, .aside, .overlay').removeClass('active');
            $('html').removeClass('overlay-active');
        }
        return false;
    });
    /* END Боковое меню */


    /* START Попап Отправить заявку */
    $('a.button-request').click(function() {
        if($('.popup.request').hasClass('active')){
            $('.popup.request, .overlay').removeClass('active');
            $('html').removeClass('overlay-active');
        }
        else{
            $('.popup.request, .overlay').addClass('active');
            $('html').addClass('overlay-active');
        }
        return false;
    });
    $('.popup.request .popup-button-close, .overlay').click(function() {
        if($('.popup.request').hasClass('active')){
            $('.popup.request, .overlay').removeClass('active');
            $('html').removeClass('overlay-active');
        }
        return false;
    });
    /* END Попап Отправить заявку */


    /* START Открытие соц. кнопок */
    $('a.social-button-open, .social-buttons-area').on('touchstart click',function(){
        $('.social-wrapper').toggleClass('active');
        return false;
    }).mouseover(function(){
        $('.social-wrapper').addClass('active');
        return false;
    }).mouseout(function(){
        $('.social-wrapper').removeClass('active');
        return false;
    });
    $(window).on('mouseup',function(event){
        var container = $('.social-wrapper');
        if (!container.is(event.target) && container.has(event.target).length === 0){
            $('.social-wrapper').removeClass('active');
        }
    });
    /* END Открытие соц. кнопок */


    /* START Масштабирование прототипов */
    $('a.button-scale-30').click(function() {
        removeClassesMask($('.prototype-frame'),'scale');
        $('.prototype-frame').removeAttr('style');
        if(!$(this).hasClass('active')){
            $('.prototype-frame').removeClass('scale-50 scale-75 scale-100').addClass('scale-30');
            $('.button-scale-50, .button-scale-75, .button-scale-100').removeClass('active');
            $('.button-scale-30').addClass('active');
        }
        return false;
    });
    $('a.button-scale-50').click(function() {
        removeClassesMask($('.prototype-frame'),'scale');
        $('.prototype-frame').removeAttr('style');
        if(!$(this).hasClass('active')){
            $('.prototype-frame').removeClass('scale-30 scale-75 scale-100').addClass('scale-50');
            $('.button-scale-30, .button-scale-75, .button-scale-100').removeClass('active');
            $('.button-scale-50').addClass('active');
        }
        return false;
    });
    $('a.button-scale-75').click(function() {
        removeClassesMask($('.prototype-frame'),'scale');
        $('.prototype-frame').removeAttr('style');
        if(!$(this).hasClass('active')){
            $('.prototype-frame').removeClass('scale-30 scale-50 scale-100').addClass('scale-75');
            $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
            $('.button-scale-75').addClass('active');
        }
        return false;
    });
    $('a.button-scale-100').click(function() {
        removeClassesMask($('.prototype-frame'),'scale');
        $('.prototype-frame').removeAttr('style');
        if(!$(this).hasClass('active')){
            $('.prototype-frame').removeClass('scale-30 scale-50 scale-75').addClass('scale-100');
            $('.button-scale-30, .button-scale-50, .button-scale-75').removeClass('active');
            $('.button-scale-100').addClass('active');
        }
        return false;
    });

    /* Фунцкия применения стилей при ресайзе окна */
    windowResizeEvent();
    $(window).on('resize',function(){
        windowResizeEvent();
    });

    /* Удаление классов задающих масштаб по умолчанию scale-** */
    function removeClassesMask($obj,className){
        var classes = $obj.attr('class') ? $obj.attr('class').split(' ') : [];
        for(var i in classes){
            if(classes[i].indexOf(className) + 1 > 0){
                delete classes[i];
            }
        }
        $obj.attr('class',classes.join(' '));
    }

    /* Функция автоматического изменения масштаба */
    function windowResizeEvent(){
        var width = $('html').innerWidth();
        if(width <= window.previewWindowWidth){
            $('.button-scale').removeClass('active');
            removeClassesMask($('.prototype-frame'),'scale');
            var scaleValue = 1 - (window.previewWindowWidth - width)/window.previewWindowWidth;
            if(scaleValue > 0){
                $('.prototype-frame').css({
                    'transform': 'scale('+(scaleValue)+')',
                    'width': (1/scaleValue) * 100 + '%',
                    'height': (1/scaleValue) * 100 + '%',
                });
            }
        }else{
            $('.prototype-frame').removeAttr('style');
        }
    }

    /* Машстабирование по контрольным точкам */
    // 1280 - 100
    // 1024 < 1280 - 90
    // 960 < 1024 - 80
    // 840 < 960 - 70
    // 720 < 840 - 60
    // 640 < 720 - 50
    // 480 < 640 - 40
    // 0 < 480 - 30
    //window.previewWindowWidth = width;
    //if(width > 1280){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-50 scale-60 scale-70 scale-80 scale-90').addClass('scale-100');
    //    $('.button-scale-30, .button-scale-50').removeClass('active');
    //    $('.button-scale-100').addClass('active');
    //}
    //if(width > 1024 && width < 1280){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-50 scale-60 scale-70 scale-80 scale-100').addClass('scale-90');
    //    $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
    //}
    //if(width > 960 && width < 1024){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-50 scale-60 scale-70 scale-90 scale-100').addClass('scale-80');
    //    $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
    //}
    //if(width > 840 && width < 960){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-50 scale-60 scale-80 scale-90 scale-100').addClass('scale-70');
    //    $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
    //}
    //if(width > 720 && width < 840){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-50 scale-70 scale-80 scale-90 scale-100').addClass('scale-60');
    //    $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
    //}
    //if(width > 640 && width < 720){
    //    $('.prototype-frame').removeClass('scale-30 scale-40 scale-60 scale-70 scale-80 scale-90 scale-100').addClass('scale-50');
    //    $('.button-scale-30, .button-scale-100').removeClass('active');
    //    $('.button-scale-50').addClass('active');
    //}
    //if(width > 480 && width < 640){
    //    $('.prototype-frame').removeClass('scale-30 scale-50 scale-60 scale-70 scale-80 scale-90 scale-100').addClass('scale-40');
    //    $('.button-scale-30, .button-scale-50, .button-scale-100').removeClass('active');
    //}
    //if(width < 480){
    //    $('.prototype-frame').removeClass('scale-40 scale-50 scale-60 scale-70 scale-80 scale-90 scale-100').addClass('scale-30');
    //    $('.button-scale-50, .button-scale-100').removeClass('active');
    //    $('.button-scale-30').addClass('active');
    //}

    /* END Масштабирование прототипов */

    /* START Открытие прототипа во всё окно */
    $('a.button-fullscreen-view, #fullscreen').click(function() {
        $('.content.prototype').toggleClass('fullscreen-view');
        $('.header').toggleClass('hide');
        return false;
    });
    /* END Открытие прототипа во всё окно */

    /* START Открытие описание прототипа */
    $('a.prototype-description-link').click(function() {
        if($(this).hasClass('active')){
            $('.prototype-description-link, .prototype-description').removeClass('active');
            $('.prototype-description-link span').html('<span class="word-first">Описание</span> <span class="word-second">проекта</span>');
        }
        else{
            $('.prototype-description-link, .prototype-description').addClass('active');
            $('.prototype-description-link span').html('<span class="word-first">Скрыть</span> <span class="word-second">описание</span>');
        }
        return false;
    });
    $('.content.prototype .prototype-browser .prototype-description .button-close, a.button-fullscreen-view').click(function() {
        if($('.prototype-description').hasClass('active')){
            $('.prototype-description-link, .prototype-description').removeClass('active');
            $('.prototype-description-link span').html('<span class="word-first">Описание</span> <span class="word-second">проекта</span>');
        }
        return false;
    });
    /* END Открытие описание прототипа */

});