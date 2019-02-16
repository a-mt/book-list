var Cookie = {
   set: function (name, value, days) {
       var expires = "";

        if (days) {
           var date = new Date();
           date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
           expires = "; expires=" + date.toGMTString();
       }
       document.cookie = name + "=" + value + expires + "; path=/";
   },
   get: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(";");

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    unset: function (name) {
        Cookie.create(name, "", -1);
    }
};

var Book = {

    // Bind events
    init: function() {

       // Open book infos
       $('.js-view').on('click', Book.view);

       $('.js-switch-view').on('click', 'span', function(){
           var $this = $(this);

           if(!$this.hasClass('active')) {
               $this.addClass('active')
                    .siblings().removeClass('active');

               var mode = $this.data('mode');
               Cookie.set('viewMode', mode, 30);

               $('.content').attr('data-mode', mode);
           }
       });
    },

    // Open up a popup to display book infos
    view: function(e) {
        e.preventDefault();
        var content = $(this).closest('.book-thumbnail').next().html();

        var $popup = $('#modal');
        $popup.find('.modal-body').html('<div class="book flex">' + content + '</div>');
        $popup.modal('show');
    }
};

$(document).ready(function(){
    Book.init();
});