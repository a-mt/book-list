var Book = {
    timer: false,
    query: false,
    lang: null,
    input: false,
    xhr: false,
    tpl: false,

    // Event binding
    init: function(){
        Book.tpl = $('#book-item-tpl').html();

        // Autocomplete
        $('.js-autocomplete-book').on('keyup', function(){
            clearTimeout(Book.timer);

            Book.input = this;
            Book.timer = setTimeout(function(){
                var val = $(Book.input).val();

                // Launch research
                if(val != Book.query) {
                    Book.query = val;
                    Book.search();
                }
            }, 300);
        });

        Book.lang = $('.js-autocomplete-lang').on('change', function(){
            Book.lang = $(this).val();
        }).val();
    },

    // Lookup books with the given name
    search: function(){
        if(Book.xhr) {
            Book.xhr.abort();
            Book.xhr = false;
        }
        $('.js-dismiss').fadeOut();

        if(!Book.query) {
            $('#results').html('');
            return;
        }
        $('.js-load').addClass('loading');

        Book.xhr = $.ajax({
           url: '/book/search',
           method: 'POST',
           data: {
               name: Book.query,
               lang: Book.lang == "None" ? "" : Book.lang
           },
           success: function(data, status, xhr) {
               var query = xhr.getResponseHeader('X-query');
               if(query != Book.query) {
                   return;
               }
               Book.xhr = false;
               var queryHtml = Book.query.replace(/</g, '&lt;')
                                         .replace(/>/g, '&gt;');

               data     = JSON.parse(data);
               $results = $('#results');
               $results.html('');

               if(!data.totalItems) {
                   $results.append('<p class="error">No books match "' + queryHtml + '". You can manually add a book below</p>');
               } else {
                   $results.append('<p class="INFO">Results for "' + queryHtml + '"</p>');

                   for(var i=0; i<data.items.length; i++) {
                       if(query != Book.query) {
                           break;
                       }
                       var html = Book.getItemHtml(data.items[i]);
                       $results.append(html);
                   }
               }
           },
           error: function(xhr) {
               if(xhr.statusText == 'abort') {
                   return;
               }
               $(Book.input).after('<p class="error js-dismiss">Something went wrong (' + xhr.status + ' ' + xhr.responseText + ')</p>');
           },
           complete: function() {
               $('.js-load').removeClass('loading');
           }
        });
    },

    getItemHtml: function(item) {
        if(item.volumeInfo.maturityRating == 'MATURE') {
            item.volumeInfo.mature = 1;
        }
        item.volumeInfo.hasAuthors = !!item.volumeInfo.authors;
        item.volumeInfo.year       = item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.substr(0,4) : "";
        return Mustache.to_html(Book.tpl, item);
    }
};

$(document).ready(function() {
   Book.init();

    $('.container').on('click', '.js-choose', function(){
        if($(this).is(':checked')) {
            $('#submit').removeAttr('disabled');
        } else {
            $('#submit').attr('disabled', 'disabled');
        }
    });
});