// Gravity.js
// Responsive framework for intuitive and easy web design


/*
    The semi-colon before the function invocation is a safety net against
    concatenated scripts and/or other plugins which may not be closed properly.

    "undefined" is used because the undefined global variable in ECMAScript 3
    is mutable (ie. it can be changed by someone else). Because we don't pass a
    value to undefined when the anonymyous function is invoked, we ensure that
    undefined is truly undefined. Note, in ECMAScript 5 undefined can no
    longer be modified.

    "window" and "document" are passed as local variables rather than global.
    This (slightly) quickens the resolution process.
*/
;(function ( $, window, document, undefined ) {
    
    /*
        Store the name of the plugin in the "pluginName" variable. This
        variable is used in the "Plugin" constructor below, as well as the
        plugin wrapper to construct the key for the "$.data" method.

        More: http://api.jquery.com/jquery.data/
    */
    var pluginName = 'gravity';

    /*
        The "Plugin" constructor, builds a new instance of the plugin for the
        DOM node(s) that the plugin is called on. For example,
        "$('h1').pluginName();" creates a new instance of pluginName for
        all h1's.
    */
    // Create the plugin constructor
    function Plugin ( element, options ) {
        /*
            Provide local access to the DOM node(s) that called the plugin,
            as well local access to the plugin name and default options.
        */
        this.element = element;
        this._name = pluginName;
        this._defaults = $.fn.gravity.defaults;
        /*
            The "$.extend" method merges the contents of two or more objects,
            and stores the result in the first object. The first object is
            empty so that we don't alter the default options for future
            instances of the plugin.

            More: http://api.jquery.com/jquery.extend/
        */
        this.options = $.extend( {}, this._defaults, options );

        /*
            The "init" method is the starting point for all plugin logic.
            Calling the init method here in the "Plugin" constructor function
            allows us to store all methods (including the init method) in the
            plugin's prototype. Storing methods required by the plugin in its
            prototype lowers the memory footprint, as each instance of the
            plugin does not need to duplicate all of the same methods. Rather,
            each instance can inherit the methods from the constructor
            function's prototype.
        */
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        // Initialization logic
        init: function () {
            /*
                Create additional methods below and call them via
                "this.myFunction(arg1, arg2)", ie: "this.buildCache();".

                Note, you can cccess the DOM node(s), plugin name, default
                plugin options and custom plugin options for a each instance
                of the plugin by using the variables "this.element",
                "this._name", "this._defaults" and "this.options" created in
                the "Plugin" constructor function (as shown in the buildCache
                method below).
            */
            this.setGravitation();
            this.buildCache();
            this.calcGravity();
            // this.bindEvents();
        },

        // Remove plugin instance completely
        destroy: function() {
            /*
                The destroy method unbinds all events for the specific instance
                of the plugin, then removes all plugin data that was stored in
                the plugin instance using jQuery's .removeData method.

                Since we store data for each instance of the plugin in its
                instantiating element using the $.data method (as explained
                in the plugin wrapper below), we can call methods directly on
                the instance outside of the plugin initalization, ie:
                $('selector').data('plugin_myPluginName').someOtherFunction();

                Consequently, the destroy method can be called using:
                $('selector').data('plugin_myPluginName').destroy();
            */
            this.unbindEvents();
            this.$element.removeData();
        },

        // Add default gravitation force
        setGravitation: function () {
            var $root = $(this.element);
            $.each(this.options.gravitation, function(index,node){
                $root.append('<div class="gravitation-node" gravity-id="'+node.name+'"></div>').find('.gravitation-node[gravity-id="'+node.name+'"]').css({
                    top: node.top,
                    left: node.left
                });
            });
        },

        // Cache DOM nodes for performance
        buildCache: function () {
            /*
                Create variable(s) that can be accessed by other plugin
                functions. For example, "this.$element = $(this.element);"
                will cache a jQuery reference to the elementthat initialized
                the plugin. Cached variables can then be used in other methods. 
            */
            this.$element = $(this.element); 
            this.$element.addClass('gravity-init');

            var options = this.options;
            var parents = 0;
            this.$element.find('.gravity').each(function(index,element){
                var parent = $(element).parent();
                parent.addClass('gravity-parent');
                $(element).attr('gravity-id',index);
                if(parent.attr('gravity-id')===undefined){
                    parent.attr('gravity-id',parents);
                    options.elements.push({
                        parent: '.gravity-parent[gravity-id='+parents+']',
                        children: []
                    });
                    if(parents>0) parents += 1;
                }
                options.elements[parents].children.push({ id: '.gravity[gravity-id='+index+']' });
            });
            this.options = options;
        },
        calcGravity: function () {
            var options = this.options;

            // store position data
            $.each(this.options.elements, function(index,group){
                group.data = {
                    aWidth: $(group.parent).outerWidth(),
                    aHeight: $(group.parent).outerHeight(),
                    gWidth: 0,
                    gHeight: 0,
                    offset: {
                        top: $(group.parent).offset().top,
                        left: $(group.parent).offset().left
                    }
                };
                group.data.gravity = {
                    top: $('.gravity-init .gravitation-node').offset().top,
                    left: $('.gravity-init .gravitation-node').offset().left
                }

                $.each(group.children, function(index,child){
                    //var top, right, bottom, left;
                    child.data = {
                        width: $(child.id).outerWidth(),
                        height: $(child.id).outerHeight()
                    }
                    child.data.force = (child.data.height*options.k);
                    child.data.center = { 
                        top: $(child.id).offset().top+(child.data.height/2), 
                        left: $(child.id).offset().left+(child.data.width/2) 
                    }
                    child.data.margin = {
                        top: parseInt($(child.id).css('margin-top'))/options.density*child.data.force,
                        right: parseInt($(child.id).css('margin-right'))/options.density*child.data.force,
                        bottom: parseInt($(child.id).css('margin-bottom'))/options.density*child.data.force,
                        left: parseInt($(child.id).css('margin-left'))/options.density*child.data.force
                    };
                    group.data.gWidth += child.data.margin.left + child.data.width + child.data.margin.right;
                    group.data.gHeight += child.data.margin.top + child.data.height + child.data.margin.bottom;
                });

                // console.log(group.data.gHeight);

                var delta = 0;

                group.data.center = {
                    top: $(group.parent).offset().top+(group.data.gHeight/2),
                    left: $(group.parent).offset().left+(group.data.gWidth/2) 
                };

                delta = {
                    top: group.data.gravity.top - group.data.center.top,
                    left: group.data.gravity.left - group.data.center.left
                }


                // calc vertical force
                if(group.data.gHeight>=group.data.aHeight){
                    group.data.padding = {
                        top: 0
                    };
                }else if(group.data.gHeight<=group.data.aHeight-delta.top){
                    group.data.padding = {
                        top: delta.top - group.data.offset.top
                    };
                }else{
                    group.data.padding = {
                        top: group.data.aHeight - group.data.gHeight
                    };
                }

                $(group.parent).css({
                    'padding-top': group.data.padding.top
                });


                // apply to DOM
                $.each(group.children, function(index,child){
                    var m = $(child.id).outerHeight()*options.k;

                    // calc text alignment force
                    if($(child.id).css('text-align')=='start'){
                        if(child.data.center.left<group.data.gravity.left/2){
                            $(child.id).css('text-align','left');
                        }else if(group.data.gravity.left<(child.data.center.left*3)/2){
                            $(child.id).css('text-align','center');
                        }else{
                            $(child.id).css('text-align','right');
                        }
                    }


                    // apply deafult margin
                    $(child.id).css({
        	        	'margin-top': child.data.margin.top+'px',
                        'margin-bottom': child.data.margin.bottom+'px',
                        'margin-left': child.data.margin.left+'px',
                        'margin-right': child.data.margin.right+'px'
                	});

                    // if margin exceeds available container, reduce
                    if(child.height+(m*2)>group.data.aHeight){
                        margin = (group.data.aHeight-child.height)/2;
                        $(child.id).css({
                            'margin-top': margin+'px',
                            'margin-bottom': margin+'px'
                        });
                    }

                    // if margin to bounds is less apply default
                    // if($(child.id).offset().left<m){
                    //     $(child.id).css({
                    //         'margin-left': m+'px'
                    //     });
                    // }

                });
            });

        },

        // Bind events that trigger methods
        bindEvents: function() {
            var plugin = this;
            
            /*
                Bind event(s) to handlers that trigger other functions, ie:
                "plugin.$element.on('click', function() {});". Note the use of
                the cached variable we created in the buildCache method.

                All events are namespaced, ie:
                ".on('click'+'.'+this._name', function() {});".
                This allows us to unbind plugin-specific events using the
                unbindEvents method below.
            */
            plugin.$element.on('click'+'.'+plugin._name, function() {
                /*
                    Use the "call" method so that inside of the method being
                    called, ie: "someOtherFunction", the "this" keyword refers
                    to the plugin instance, not the event handler.

                    More: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
                */
                plugin.someOtherFunction.call(plugin);
            });
        },

        // Unbind events that trigger methods
        unbindEvents: function() {
            /*
                Unbind all events in our plugin's namespace that are attached
                to "this.$element".
            */
            this.$element.off('.'+this._name);
        },

        /*
            "someOtherFunction" is an example of a custom method in your
            plugin. Each method should perform a specific task. For example,
            the buildCache method exists only to create variables for other
            methods to access. The bindEvents method exists only to bind events
            to event handlers that trigger other methods. Creating custom
            plugin methods this way is less confusing (separation of concerns)
            and makes your code easier to test.
        */
        // Create custom methods
        someOtherFunction: function() {
            alert('I promise to do something cool!');
            this.callback();
        },

        callback: function() {
            // Cache onComplete option
            var onComplete = this.options.onComplete;

            if ( typeof onComplete === 'function' ) {
                /*
                    Use the "call" method so that inside of the onComplete
                    callback function the "this" keyword refers to the
                    specific DOM node that called the plugin.

                    More: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
                */
                onComplete.call(this.element);
            }
        }

    });

    /*
        Create a lightweight plugin wrapper around the "Plugin" constructor,
        preventing against multiple instantiations.

        More: http://learn.jquery.com/plugins/basic-plugin-creation/
    */
    $.fn.gravity = function ( options ) {
        this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                /*
                    Use "$.data" to save each instance of the plugin in case
                    the user wants to modify it. Using "$.data" in this way
                    ensures the data is removed when the DOM element(s) are
                    removed via jQuery methods, as well as when the userleaves
                    the page. It's a smart way to prevent memory leaks.

                    More: http://api.jquery.com/jquery.data/
                */
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });
        /*
            "return this;" returns the original jQuery object. This allows
            additional jQuery methods to be chained.
        */
        return this;
    };

    /*
        Attach the default plugin options directly to the plugin object. This
        allows users to override default plugin options globally, instead of
        passing the same option(s) every time the plugin is initialized.

        For example, the user could set the "property" value once for all
        instances of the plugin with
        "$.fn.pluginName.defaults.property = 'myValue';". Then, every time
        plugin is initialized, "property" will be set to "myValue".

        More: http://learn.jquery.com/plugins/advanced-plugin-concepts/
    */
    $.fn.gravity.defaults = {
        gravitation: [{ name: 'g1', top: '50%', left: '50%' }],
        k: 0.618,
        density: 10,
        elements: [],
        onComplete: null
    };

    if($('.gravity').length){
        $('body').gravity();
    }

})( jQuery, window, document );
