/**!
 * MixItUp v3.0.0-beta
 *
 * @copyright Copyright 2014-2015 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://mixitup.kunkalabs.com
 *
 * @license   Commercial use requires a commercial license.
 *            https://mixitup.kunkalabs.com/licenses/
 *
 *            Non-commercial use permitted under terms of CC-BY-NC license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function(window, document, undf) {
    'use strict';

    var mixItUp = null,
        _MixItUp = null,
        _Target = null,
        _doc = null,
        _h = null;

    /* _MixItUp Core
    ---------------------------------------------------------------------- */

    /**
     * _MixItUp
     * @since 2.0.0
     * @constructor
     */

    _MixItUp = function() {
        var self = this;

        self._execAction('_constructor', 0);

        _h._extend(self, {

            /* Public Properties
            ---------------------------------------------------------------------- */

            selectors: {
                target: '.mix',
                filter: '.filter',
                filterToggle: '.filter-toggle',
                multiMix: '.multimix',
                sort: '.sort'
            },

            animation: {
                enable: true,
                effects: 'fade scale',
                duration: 600,
                easing: 'ease',
                perspectiveDistance: '3000',
                perspectiveOrigin: '50% 50%',
                queue: true,
                queueLimit: 1,
                animateChangeLayout: false,
                animateResizeContainer: true,
                animateResizeTargets: false,
                staggerSequence: false,
                reverseOut: false
            },

            callbacks: {
                onMixLoad: null,
                onMixStart: null,
                onMixBusy: null,
                onMixEnd: null,
                onMixFail: null,
                onMixClick: null,
                _user: null
            },

            controls: {
                enable: true,
                live: false,
                toggleFilterButtons: false,
                toggleLogic: 'or',
                activeClass: 'active'
            },

            layout: {
                display: 'inline-block',
                containerClass: '',
                containerClassFail: 'fail'
            },
            
            load: {
                filter: 'all',
                sort: false
            },

            libraries: {
                q: null
            },

            debug: {
                enable: true
            },

            document: null,

            extensions: null,

            /* DOM
            ---------------------------------------------------------------------- */

            _dom: {
                _body: null,
                _container: null,
                _targets: [],
                _parent: null,
                _sortButtons: [],
                _filterButtons: [],
                _filterToggleButtons: [],
                _multiMixButtons: [],
                _allButtons: []
            },

            /* Private Properties
            ---------------------------------------------------------------------- */

            _isMixing: false,
            _isSorting: false,
            _isClicking: false,
            _isLoading: true,
            _isChangingLayout: false,
            _isRemoving: false,

            _targets: [],
            _show: [],
            _hide: [],
            _toShow: [],
            _toHide: [],
            _toMove: [],

            _origOrder: [],
            _currentOrder: [],
            _newOrder: [],

            _activeFilter: null,
            _toggleArray: [],
            _toggleString: '',
            _activeSort: 'default:asc',
            _newSort: null,
            _staggerDuration: 0,
            _startHeight: null,
            _newHeight: null,
            _incPadding: true,
            _newDisplay: null,
            _newContainerClass: null,
            _targetsBound: 0,
            _targetsDone: 0,
            _userPromise: null,
            _effects: null,
            _queue: [],
            _state: null,
            _vendor: ''
        });

        self._execAction('_constructor', 1);
    };

    /**
     * _MixItUp.prototype
     * @since 2.0.0
     * @prototype
     * @override
     */

    _MixItUp.prototype = {
        constructor: _MixItUp,

        /* Static Properties
        ---------------------------------------------------------------------- */

        _transformProp: 'transform',
        _transformRule: 'transform',
        _transitionProp: 'transition',

        _transformDefaults: [
            ['scale', '.01'],
            ['translateX', '20px'],
            ['translateY', '20px'],
            ['translateZ', '20px'],
            ['rotateX', '90deg'],
            ['rotateY', '90deg'],
            ['rotateZ', '180deg']
        ],

        _is: {},
        _has: {},

        _instances: {},

        _handled: {
            _filter: {},
            _sort: {}
        },

        _bound: {
            _filter: {},
            _sort: {}
        },

        _actions: {},
        _filters: {},
        
        /* Public Static Methods
        ---------------------------------------------------------------------- */

        /**
         * extend
         * @since 2.1.0
         * @param {Object} new properties/methods
         */

        extend: function(extension) {
            for (var key in extension) {
                if (extension[key]) {
                    _MixItUp.prototype[key] = extension[key];
                }
            }
        },

        /**
         * addAction
         * @since 2.1.0
         * @param {String} hook name
         * @param {String} name
         * @param {Function} func
         * @param {Number} priority
         * @extends {Object} _MixItUp.prototype._actions
         */

        addAction: function(hook, name, func, priority) {
            _MixItUp.prototype._addHook('_actions', hook, name, func, priority);
        },

        /**
         * addFilter
         * @since 2.1.0
         * @param {String} hook
         * @param {String} name
         * @param {Function} func
         * @extends {Object} _MixItUp.prototype._filters
         */

        addFilter: function(hook, name, func) {
            _MixItUp.prototype._addHook('_filters', hook, name, func);
        },

        /* Private Static Methods
        ---------------------------------------------------------------------- */

        /**
         * _addHook
         * @since 2.1.0
         * @param {String} type of hook
         * @param {String} hook name
         * @param {Function} function to execute
         * @param {Number} priority
         * @extends {Object} _MixItUp.prototype._filters
         */

        _addHook: function(type, hook, name, func, priority) {
            var collection = _MixItUp.prototype[type],
                obj = {};
                
            priority = (priority === 1 || priority === 'post') ? 'post' : 'pre';
                
            obj[hook] = {};
            obj[hook][priority] = {};
            obj[hook][priority][name] = func;

            _h._extend(collection, obj);
        },

        /**
         * _featureDetect
         * @since 2.0.0
         */
        
        _featureDetect: function() {
            var self = this,
                testEl = document.createElement('div'),
                vendorsTrans = ['Webkit', 'Moz', 'O', 'ms'],
                vendorsRAF = ['webkit', 'moz'],
                transitionPrefix = _h._getPrefix(testEl, 'Transition', vendorsTrans),
                transformPrefix = _h._getPrefix(testEl, 'Transform', vendorsTrans),
                i = -1;

            self._vendor = transformPrefix; // TODO: this is only used for box-sizing, make a seperate test

            _MixItUp.prototype._has._promises = typeof Promise === 'function';
            _MixItUp.prototype._has._transitions = transitionPrefix !== false;
            _MixItUp.prototype._is._crapIe = window.atob ? false : true;
            _MixItUp.prototype._transitionProp = transitionPrefix ? transitionPrefix + 'Transition' : 'transition';
            _MixItUp.prototype._transformProp = transformPrefix ? transformPrefix + 'Transform' : 'transform';
            _MixItUp.prototype._transformRule = transformPrefix ? '-' + transformPrefix + '-transform' : 'transform';
            
            /* Polyfills
            ---------------------------------------------------------------------- */

            /**
             * window.requestAnimationFrame
             */

            for (i = 0; i < vendorsRAF.length && !window.requestAnimationFrame; i++){
                window.requestAnimationFrame = window[vendorsRAF[i]+'RequestAnimationFrame'];
            }

            /**
             * Element.nextElementSibling
             */

            if (testEl.nextElementSibling === undf) {
                Object.defineProperty(Element.prototype, 'nextElementSibling', {
                    get: function() {
                        var el = this.nextSibling;
                        
                        while (el) {
                            if (el.nodeType ===1) {
                                return el;
                            }

                            el = el.nextSibling;
                        }

                        return null;
                    }
                });
            }

            /**
             * Element.matches
             */

            (function(ElementPrototype) {
                ElementPrototype.matches = ElementPrototype.matches || 
                    ElementPrototype.machesSelector ||
                    ElementPrototype.mozMatchesSelector ||
                    ElementPrototype.msMatchesSelector ||
                    ElementPrototype.oMatchesSelector ||
                    ElementPrototype.webkitMatchesSelector ||
                    function (selector) {
                        var node = this,
                            nodes = (node.parentNode || node._doc).querySelectorAll(selector),
                            i = -1;
                 
                        while (nodes[++i] && nodes[i] != node) {
                            return !!nodes[i];
                        }
                    };
            })(Element.prototype);
            
            self._execAction('_featureDetect', 1);
        },

        /* Private Methods
        ---------------------------------------------------------------------- */

        /**
         * _init
         * @since 2.0.0
         * @param {Object} el
         * @param {Object} config
         */

        _init: function(el, config) {
            var self = this;
            
            self._execAction('_init', 0, arguments);

            config && _h._extend(self, config);

            self._cacheDom(el);
            
            self.layout.containerClass && _h._addClass(el, self.layout.containerClass);

            self.animation.enable = self.animation.enable && _MixItUp.prototype._has._transitions;

            self._indexTargets(true);

            if (self.load.sort) {
                self._newSort = self._parseSort(self.load.sort);
                self._newSortString = self.load.sort;
                self._activeSort = self.load.sort;
                self._sort();
                self._printSort();
            }

            self._activeFilter = self.load.filter === 'all' ? 
                self.selectors.target :
                self.load.filter === 'none' ?
                    '' :
                    self.load.filter;

            if (self._dom._filterToggleButtons.length) { // TODO: what about live toggles? is it worth trawling the dom?
                self._buildToggleArray();
            }

            self._updateControls({filter: self._activeFilter, sort: self._activeSort});

            self._effects = self._parseEffects();

            self._filter();
            self._buildState();
            self._bindEvents();

            self._execAction('_init', 1, arguments);
        },

        /**
         * _cacheDom
         * @since 3.0.0
         */

        _cacheDom: function(el) {
            var self = this;

            self._execAction('_cacheDom', 0, arguments);

            self._dom._body = _doc.getElementsByTagName('body')[0];
            self._dom._container = el;
            self._dom._parent = el;
            self._dom._sortButtons = Array.prototype.slice.call(_doc.querySelectorAll(self.selectors.sort));
            self._dom._filterButtons = Array.prototype.slice.call(_doc.querySelectorAll(self.selectors.filter));
            self._dom._filterToggleButtons = Array.prototype.slice.call(_doc.querySelectorAll(self.selectors.filterToggle));
            self._dom._multiMixButtons = Array.prototype.slice.call(_doc.querySelectorAll(self.selectors.multiMix));
            self._dom._allButtons = self._dom._filterButtons
                .concat(self._dom._sortButtons)
                .concat(self._dom._filterToggleButtons)
                .concat(self._dom._multiMixButtons);

            self._execAction('_cacheDom', 1, arguments);
        },

        /**
         * _indexTargets
         * @since 3.0.0
         */

        _indexTargets: function(){
            var self = this,
                target = null,
                el = null,
                i = -1;
                
            self._execAction('_indexTargets', 0, arguments);

            self._dom._targets = _h._children(self._dom._container, self.selectors.target); // TODO: allow querying of all descendants via config option, allowing for nested parent

            self._targets = [];
            
            if (self._dom._targets.length) {
                for (i = 0; el = self._dom._targets[i]; i++) {
                    target = new _Target();

                    target._init(el, self);

                    target._finalPosData = target._getPosData();

                    self._targets.push(target);
                }

                self._dom._parent = self._dom._targets[0].parentElement.isEqualNode(self._dom._container) ?
                    self._dom._container :
                    self._dom._targets[0].parentElement;
            }

            self._currentOrder = self._origOrder = self._targets;
            
            self._execAction('_indexTargets', 1, arguments);
        },

        /**
         * _bindEvents
         * @since 3.0.0
         */

        _bindEvents: function(){
            var self = this,
                proto = _MixItUp.prototype,
                filters = proto._bound._filter,
                sorts = proto._bound._sort,
                button = null,
                i = -1;

            self._execAction('_bindEvents', 0);

            self._handler = function(e) {
                return self._eventBus(e);
            };

            if (self.controls.live) {
                _h._on(window, 'click', self._handler);
            } else {
                for (i = 0; button = self._dom._allButtons[i]; i++) {
                    _h._on(button, 'click', self._handler);
                }
            }

            filters[self.selectors.filter] = (filters[self.selectors.filter] === undf) ?
                1 : filters[self.selectors.filter] + 1;

            sorts[self.selectors.sort] = (sorts[self.selectors.sort] === undf) ?
                1 : sorts[self.selectors.sort] + 1;

            self._execAction('_bindEvents', 1);
        },

        /**
         * _unbindEvents
         * @since 3.0.0
         */

        _unbindEvents: function() {
            var self = this,
                button = null,
                i = -1;

            self._execAction('_unbindEvents', 0);

            _h._off(window, 'click', self._handler);

            for (i = 0; button = self._dom._allButtons[i]; i++) {
                _h._on(button, 'click', self._handler);
            }

            self._execAction('_unbindEvents', 1);

            delete self._handler;
        },

        /**
         * _eventBus
         * @param {Object} e
         */

        _eventBus: function(e) {
            var self = this;

            switch(e.type) {
                case 'click':
                    return self._handleClick(e);
            }
        },
        
        /**
         * _handleClick
         * @since 3.0.0
         * @param {object} button
         * @param {string} type
         */
        
        _handleClick: function(e){
            var self = this,
                selectors = [],
                selector = '',
                toggleSeperator = self.controls.toggleLogic === 'or' ? ',' : '',
                target = null,
                command = {},
                filterString = '',
                sortString = '',
                method = '',
                isTogglingOff = false,
                button = null,
                key = '',
                i = -1;
            
            self._execAction('_handleClick', 0, arguments);

            if (typeof self.callbacks.onMixClick === 'function') {
                self.callbacks.onMixClick.call(self._dom._container, self._state, self);
            }

            for (key in self.selectors) {
                selectors.push(self.selectors[key]);
            }

            selector = selectors.join(',');

            target = _h._closestParent(
                e.target,
                selector,
                true
            );

            if (!target) return;

            if (
                self._isMixing &&
                (!self.animation.queue || self._queue.length >= self.animation.queueLimit)
            ) {
                if (typeof self.callbacks.onMixBusy === 'function'){
                    self.callbacks.onMixBusy.call(self._dom._container, self._state, self);
                }

                self._execAction('_handleClickBusy', 1, arguments);

                return;
            }

            self._isClicking = true;

            // sort

            if (target.matches(self.selectors.sort)) {
                sortString = target.getAttribute('data-sort');
                if (
                    !_h._hasClass(target, self.controls.activeClass) ||
                    sortString.indexOf('random') > -1
                ) {
                    method = 'sort';

                    for (i = 0; button = self._dom._sortButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        sort: sortString
                    };
                } else {
                    return;
                }
            } 

            // filter

            else if (target.matches(self.selectors.filter)) {
                if (!_h._hasClass(target, self.controls.activeClass)) {
                    method = 'filter';

                    for (i = 0; button = self._dom._filterButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom._filterToggleButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        filter: target.getAttribute('data-filter')
                    };
                } else {
                    return;
                }
            } 

            // filterToggle

            else if (target.matches(self.selectors.filterToggle)) {
                filterString = target.getAttribute('data-filter');
                method = 'filterToggle';

                self._buildToggleArray();

                if (!_h._hasClass(target, self.controls.activeClass)) {
                    self._toggleArray.push(filterString);
                } else {
                    self._toggleArray.splice(self._toggleArray.indexOf(filterString, 1));

                    isTogglingOff = true;
                }

                self._toggleArray = _h._clean(self._toggleArray);
                self._toggleArray = self._toggleArray.join(self.controls.toggleLogic === 'or' ? ',' : '');

                for (i = 0; button = self._dom._filterButtons[i]; i++) {
                    _h._removeClass(button, self.controls.activeClass);
                }

                for (i = 0; button = self._dom._multiMixButtons[i]; i++) {
                    _h._removeClass(button, self.controls.activeClass);
                }

                self._toggleString = self._toggleArray.join(seperator);

                command = {
                    filter: self._toggleString
                };
            } 

            // multiMix

            else if (target.matches(self.selectors.multiMix)) {
                if (!_h._hasClass(target, self.controls.activeClass)) {
                    method = 'multiMix';

                    for (i = 0; button = self._dom._filterButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom._filterToggleButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom._sortButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom._multiMixButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        sort: target.getAttribute('data-sort'),
                        filter: target.getAttribute('data-filter')
                    };
                } else {
                    return;
                }
            }

            if (method) {
                self._trackClick(target, method, isTogglingOff);

                self.multiMix(command);
            }

            self._execAction('_handleClick', 1, arguments);
        },

        /**
         * _trackClick
         * @since 3.0.0
         * @param {Element} button
         * @param {String} method
         * @param {Boolean} isTogglingOff
         */

        _trackClick: function(button, method, isTogglingOff) {
            var self = this,
                proto = _MixItUp.prototype,
                selector = self.selectors[method];

            method = '_'+method;

            proto._handled[method][selector] = (proto._handled[method][selector] === undf) ?
                1 :
                proto._handled[method][selector] + 1;

            if (
                proto._handled[method][selector] ===
                proto._bound[method][selector]
            ) {
                _h[(isTogglingOff ? '_remove' : '_add') + 'Class'](button, self.controls.activeClass);

                delete proto._handled[method][selector];
            }
        },

        /**
         * _buildToggleArray
         * @since 2.0.0
         */

        _buildToggleArray: function() {
            var self = this,
                activeFilter = self._activeFilter.replace(/\s/g, ''),
                filter = '',
                i = -1;

            self._execAction('_buildToggleArray', 0, arguments);

            if (self.controls.toggleLogic === 'or') {
                self._toggleArray = activeFilter.split(',');
            } else {
                self._toggleArray = activeFilter.split('.');
            
                !self._toggleArray[0] && self._toggleArray.shift();
            
                for (i = 0; filter = self._toggleArray[i]; i++) {
                    self._toggleArray[i] = '.'+filter;
                }
            }
            
            self._execAction('_buildToggleArray', 1, arguments);
        },

        /**
         * _updateControls
         * @since 2.0.0
         * @param {Object} command
         */

        _updateControls: function(command) {
            var self = this,
                output = {
                    filter: command.filter,
                    sort: command.sort
                },
                filterToggleButton = null,
                activeButton = null,
                button = null,
                selector = '',
                i = -1,
                j = -1,
                k = -1;
                
            self._execAction('_updateControls', 0, arguments);

            (command.filter === undf) && (output.filter = self._activeFilter);
            (command.sort === undf) && (output.sort = self._activeSort);
            (output.filter === self.selectors.target) && (output.filter = 'all');               

            for (i = 0; button = self._dom._sortButtons[i]; i++) {
                _h._removeClass(button, self.controls.activeClass);

                if (button.matches('[data-sort="' + output.sort + '"]')) {
                    _h._addClass(button, self.controls.activeClass);
                }
            }

            for (i = 0; button = self._dom._filterButtons[i]; i++) {
                _h._removeClass(button, self.controls.activeClass);
            }

            for (i = 0; button = self._dom._multiMixButtons[i]; i++) {
                _h._removeClass(button, self.controls.activeClass);

                if (
                    button.matches('[data-sort="' + output.sort + '"]') &&
                    button.matches('[data-filter="' + output.filter + '"]')
                ) {
                    _h._addClass(button, self.controls.activeClass);
                }
            }

            if (self._toggleArray.length) { 
                if (output.filter === 'none' || output.filter === '') {
                    for (i = 0; button = self._dom._filterToggleButtons[i]; i++) {
                        _h._removeClass(button, self.controls.activeClass);
                    }
                }

                for (j = 0; selector = self._toggleArray[j]; j++) {
                    activeButton = null;

                    if (self.controls.live) {
                        activeButton = _doc
                            .querySelector(self.selectors.filterToggle + '[data-filter="' + selector + '"]');
                    } else {
                        for (k = 0; filterToggleButton = self._dom._filterToggleButtons[k]; k++) {
                            if (filterToggleButton.matches('[data-filter="' + selector + '"]')) {
                                activeButton = filterToggleButton;
                            }
                        }
                    }

                    _h._addClass(activeButton, self.controls.activeClass);
                }
            } else {
                for (i = 0; button = self._dom._filterButtons[i]; i++) {
                    if (button.matches('[data-filter="' + output.filter + '"]')) {
                        _h._addClass(button, self.controls.activeClass);
                    }
                }
            }

            self._execAction('_updateControls', 1, arguments);              
        },

        /**
         * _filter
         * @since 2.0.0
         */

        _filter: function(){
            var self = this,
                condition = false,
                target = null,
                i = -1;

            self._execAction('_filter', 0);

            self._show = [];
            self._hide = [];
            self._toShow = [];
            self._toHide = [];

            for (i = 0; target = self._targets[i]; i++) {

                // show via selector

                if (typeof self._activeFilter === 'string') {
                    condition = self._activeFilter === '' ? 
                        false : target._dom._el.matches(self._activeFilter);

                    self._evaluateHideShow(condition, target);
                } 

                // show via element

                else if (
                    typeof self._activeFilter === 'object' &&
                    _h._isElement(self._activeFilter)
                ) {
                    self._evaluateHideShow(target._dom._el === self._activeFilter, target);
                }

                // show via collection

                else if (
                    typeof self._activeFilter === 'object' &&
                    self._activeFilter.length
                ) {
                    self._evaluateHideShow(self._activeFilter.indexOf(target._dom._el) > -1, target);
                }

                // hide via selector

                else if (
                    typeof self._activeFilter === 'object' &&
                    typeof self._activeFilter.hide === 'string'
                ) {
                    self._evaluateHideShow(!target._dom._el.matches(self._activeFilter.hide), target, true);
                } 

                // hide via element

                else if (
                    typeof self._activeFilter.hide === 'object' &&
                    _h._isElement(self._activeFilter.hide)
                ) {
                    self._evaluateHideShow(target._dom._el !== self._activeFilter.hide, target, true);
                }

                // hide via collection

                else if (
                    typeof self._activeFilter.hide === 'object' &&
                    self._activeFilter.hide !== null &&
                    self._activeFilter.hide.length
                ) {
                    self._evaluateHideShow(self._activeFilter.hide.indexOf(target._dom._el) < 0, target, true);
                }
            }

            self._execAction('_filter', 1);
        },

        /**
         * _evaluateHideShow
         * @since 3.0.0
         * @param {Boolean} condition
         * @param {Element} target
         * @param {Boolean} isRemoving
         */

        _evaluateHideShow: function(condition, target, isRemoving) {
            var self = this;

            if (condition) {
                if (isRemoving && typeof self._state.activeFilter === 'string') {
                    self._evaluateHideShow(target._dom._el.matches(self._state.activeFilter), target);
                } else {
                    self._show.push(target);

                    !target._isShown && self._toShow.push(target);
                }
            } else {
                self._hide.push(target);

                target._isShown && self._toHide.push(target);
            }
        },

        /**
         * _sort
         * @since 2.0.0
         */

        _sort: function() {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_sort', 0);

            self._currentOrder = [];

            for (i = 0; target = self._targets[i]; i++) {
                self._currentOrder.push(target);
            }

            switch (self._newSort[0].sortBy) {
                case 'default':
                    self._newOrder = self._origOrder.slice();

                    if (self._newSort[0].order === 'desc') {
                        self._newOrder.reverse();
                    }

                    break;
                case 'random':
                    self._newOrder = _h._arrayShuffle(self._currentOrder);

                    break;
                case 'custom':
                    self._newOrder = self._newSort[0].order;

                    break;
                default:
                    self._newOrder = self._currentOrder
                        .slice()
                        .sort(function(a, b){
                            return self._compare(a, b);
                        });
            }

            if (
                _h._isEqualArray(self._newOrder, self._currentOrder)
            ) {
                self._isSorting = false; 

                // TODO: what if the sort changes are off screen i.e. pagination?
            }

            self._targets = self._newOrder;

            self._execAction('_sort', 1);
        },

        /**
         * _compare
         * @algorithm
         * @since 2.0.0
         * @param {String|Number} a
         * @param {String|Number} b
         * @param {Number} depth (recursion)
         * @return {Number}
         */

        _compare: function(a, b, depth){
            depth = depth ? depth : 0;

            var self = this,
                order = self._newSort[depth].order,
                isString = false,
                attrA = self._getAttributeValue(a),
                attrB = self._getAttributeValue(b);

            if (isNaN(attrA * 1) || isNaN(attrB * 1)) {
                attrA = attrA.toLowerCase();
                attrB = attrB.toLowerCase();
            } else {
                attrA = attrA * 1;
                attrB = attrB * 1;
            }
                
            if (attrA < attrB)
                return order === 'asc' ? -1 : 1;
            if (attrA > attrB)
                return order === 'asc' ? 1 : -1;
            if (attrA === attrB && self._newSort.length > depth + 1)
                return self._compare(a, b, depth + 1);

            return 0;
        },

        /**
         * _getAttributeValue
         * @since 3.0.0
         * @param {Element} target
         * @return {String|Number}
         */

        _getAttributeValue: function(target) {
            var self = this,
                value = target._dom._el.getAttribute('data-' + self._newSort[depth].sortBy);

            if (value === null) {
                if (_h._canReportErrors(self)) {
                    self._isSorting = false;

                    throw new Error(
                        '[MixItUp] The attribute "data-' +
                        self._newSort[depth].sortBy) +
                        '" was not present on one or more target elements';
                }
            }

            return value || 0;
        },

        /**
         * _printSort
         * @since 2.0.0
         * @param {Boolean} reset
         */

        _printSort: function(reset) {
            var self = this,
                order = reset ? self._currentOrder : self._newOrder,
                targets = _h._children(self._dom._parent, self.selectors.target),
                nextSibling = targets.length ? targets[targets.length - 1].nextElementSibling : null,
                frag = _doc.createDocumentFragment(),
                target = null,
                whiteSpace = null,
                el = null,
                i = -1;

            self._execAction('_printSort', 0, arguments);

            for (i = 0; el = targets[i]; i++) {
                whiteSpace = el.nextSibling;

                if (el.style.position === 'absolute') continue;

                if (whiteSpace && whiteSpace.nodeName === '#text') {
                    self._dom._parent.removeChild(whiteSpace);
                }

                self._dom._parent.removeChild(el);
            }

            for (i = 0; target = order[i]; i++) {
                el = target._dom._el;

                frag.appendChild(el);
                frag.appendChild(_doc.createTextNode(' '));
            }

            nextSibling ? 
                self._dom._parent.insertBefore(frag, nextSibling) :
                self._dom._parent.appendChild(frag);

            self._execAction('_printSort', 1, arguments);
        },

        /**
         * _parseSort
         * @since 2.0.0
         * @param {String} sortString
         * @return {String[]} newSort
         */

        _parseSort: function(sortString) {
            var self = this,
                rules = typeof sortString === 'string' ? sortString.split(' ') : [sortString],
                newSort = [],
                ruleObj = null,
                rule = [],
                i = -1;

            for (i = 0; i < rules.length; i++) {
                rule = typeof sortString === 'string' ? rules[i].split(':') : ['custom', rules[i]];
                ruleObj = {
                    sortBy: _h._camelCase(rule[0]),
                    order: rule[1] || 'asc'
                };

                newSort.push(ruleObj);

                if (ruleObj.sortBy === 'default' || ruleObj.sortBy === 'random') break;
            }

            return self._execFilter('_parseSort', newSort, arguments);
        },

        /**
         * _parseEffects
         * @since 2.0.0
         * @return {Object} effects
         */

        _parseEffects: function() {
            var self = this,
                effects = {};

            effects.opacity = self._parseEffect('fade') ?
                (self._parseEffect('fade',true).val || '0') :
                '1';
            effects.transformIn = self._buildTransformString();
            effects.transformOut = self.animation.reserveOut ?
                self._buildTransformStrings(true) :
                effects.transformIn;

            self.animation.stagger = self._parseEffect('stagger') ? true : false;

            self._staggerDuration = parseInt(
                self._parseEffect('stagger') ?
                    (
                        self._parseEffect('stagger', true).val ?
                            self._parseEffect('stagger', true).val :
                            100
                    ) :
                    0
            );

            return self._execFilter('_parseEffects', effects);
        },

        /**
         * _buildTransformString
         * @since 3.0.0
         * @param {Boolean} invert
         * @return {String}
         */

        _buildTransformString: function(invert) {
            var self = this,
                prop = '',
                def = '',
                transform = null,
                transformString = '',
                inverted = false,
                i = -1;
            
            for (i = 0; transform = _MixItUp.prototype._transformDefaults[i]; i++) {
                prop = transform[0];
                def = transform[1];
                inverted = invert && prop !== 'scale';
                    
                transformString +=
                    self._parseEffect(prop) ?
                        (
                            prop +
                            '(' +
                            _h._negateValue(self._parseEffect(prop, true).val || def, inverted) +
                            ') '
                        ) :
                        '';
            }

            return transformString;
        },

        /**
         * _parseEffect
         * @since 2.0.0
         * @param {String} effect
         * @param {Boolean} extract
         * @return {Object|Boolean}
         */

        _parseEffect: function(effect, extract) {
            var self = this,
                propIndex = -1,
                str = '',
                match = [],
                valu = '';

            if (self.animation.effects.indexOf(effect) > -1) {
                if (extract) {
                    propIndex = self.animation.effects.indexOf(effect + '(');

                    if (propIndex > -1) {
                        str = self.animation.effects.substring(propIndex);
                        match = /\(([^)]+)\)/.exec(str);
                        val = match[1];

                        return {val: val};
                    }
                }

                return true;
            } else {
                return false;
            }
        },

        /**
         * _buildState
         * @since 2.0.0
         * @param {Boolean} future
         * @return [{Object}] futureState
         */

        _buildState: function(future) {
            var self = this,
                state = {},
                targets = [],
                show = [],
                hide = [],
                target = null,
                i = -1;

            self._execAction('_buildState', 0);

            for (i = 0; target = self._targets[i]; i++) {
                targets.push(target._dom._el);

                if (target._isShown) {
                    show.push(target._dom._el);
                } else {
                    hide.push(target._dom._el);
                }
            }

            state = {
                activeFilter: self._activeFilter === '' ? 'none' : self._activeFilter,
                activeSort: future && self._newSortString ? self._newSortString : self._activeSort,
                hasFailed: !self._show.length && self._activeFilter !== '',
                targets: targets,
                show: show,
                hide: hide,
                totalTargets: self._targets.length,
                totalShow: self._show.length,
                totalHide: self._hide.length,
                instance: self,
                display: future && self._newDisplay ? self._newDisplay : self.layout.display
            };

            if (future) {
                return self._execFilter('_buildState', state);
            } else {
                self._state = state;

                self._execAction('_buildState', 1);
            }
        },

        /**
         * _goMix
         * @param {Boolean} animate
         * @since 2.0.0
         */

        _goMix: function(animate) {
            var self = this,
                defered = null,
                resolvePromise = null,
                scrollTop = -1,
                scrollLeft = -1,
                docHeight = -1,
                done = function() {
                    self._isMixing = false;

                    self._cleanUp();

                    self._userPromise.resolve(self._state);
                    self._userPromise.isResolved = true;
                },
                checkProgress = function() {
                    self._targetsDone++;

                    if (self._targetsBound === self._targetsDone) {
                        done();
                    }                    
                },
                getDocumentState = function() {
                    scrollTop = window.pageYOffset;
                    scrollLeft = window.pageXOffset;
                    docHeight = _doc.documentElement.scrollHeight;
                },
                performMix = function() {
                    var target = null,
                        posIn = {},
                        posOut = {},
                        toShow = false,
                        resize = self.animation.animateResizeTargets,
                        i = -1,
                        doneHide = function() {
                            this._hide();

                            checkProgress();
                        };

                    for (i = 0; target = self._show[i]; i++) {
                        posIn = {
                            x: target._isShown ? target._startPosData.x - target._interPosData.x : 0,
                            y: target._isShown ? target._startPosData.y - target._interPosData.y : 0
                        },
                        posOut = {
                            x: target._finalPosData.x - target._interPosData.x,
                            y: target._finalPosData.y - target._interPosData.y
                        },
                        toShow = target._isShown ? false : 'show';

                        if (self.animation.animateResizeTargets) {
                            posIn.width = target._startPosData.width;
                            posIn.height = target._startPosData.height;

                            if (target._startPosData.width - target._finalPosData.width) {
                                posIn.marginRight = -(target._startPosData.width - target._interPosData.width) + (target._startPosData.marginRight * 1);
                            } else {
                                posIn.marginRight = target._startPosData.marginRight;
                            }

                            if (target._startPosData.height - target._finalPosData.height) {
                                posIn.marginBottom = -(target._startPosData.height - target._interPosData.height) + (target._startPosData.marginBottom * 1);
                            } else {
                                posIn.marginBottom = target._startPosData.marginBottom;
                            }

                            posOut.width = target._finalPosData.width;
                            posOut.height = target._finalPosData.height;
                            posOut.marginRight = -(target._finalPosData.width - target._interPosData.width) + (target._finalPosData.marginRight * 1);
                            posOut.marginBottom = -(target._finalPosData.height - target._interPosData.height) + (target._finalPosData.marginBottom * 1);
                        }

                        target._show();

                        target._move({
                            posIn: posIn,
                            posOut: posOut,
                            hideOrShow: toShow,
                            staggerIndex: i,
                            callback: checkProgress
                        });
                    }

                    for (i = 0; target = self._toHide[i]; i++) {
                        posIn = {
                            x: target._isShown ? target._startPosData.x - target._interPosData.x : 0,
                            y: target._isShown ? target._startPosData.y - target._interPosData.y : 0
                        };

                        target._move({
                            posIn: posIn,
                            posOut: {x: 0, y: 0},
                            hideOrShow: 'hide',
                            staggerIndex: i,
                            callback: checkProgress
                        });
                    }

                    if (self.animation.animateResizeContainer) {
                        self._dom._parent.style[_MixItUp.prototype._transitionProp] = 'height ' + self.animation.duration + 'ms ease';
                        
                        requestAnimationFrame(function() {
                            self._dom._parent.style.height = self._newHeight + 'px';
                        });
                    }

                    if (self._isChangingLayout) {
                        _h._removeClass(self._dom._container, self.layout.containerClass);
                        _h._addClass(self._dom._container, self._newContainerClass);
                    }
                },
                futureState = self._buildState(true);
                
            self._execAction('_goMix', 0, arguments);

            !self.animation.duration && (animate = false);

            if (!self._toShow.length && !self._toHide.length && !self._isSorting && !self._isChangingLayout) {
                animate = false;            
            }

            if (
                !self._userPromise ||
                self._userPromise.isResolved
            ) {
                self._userPromise = _h._getPromise(self.libraries);
            }

            if (typeof self.callbacks.onMixStart === 'function') {
                self.callbacks.onMixStart.call(self._dom._container, self._state, futureState, self);
            }

            _h._trigger(self._dom._container, 'mixStart', {
                state: self._state,
                futureState: futureState,
                instance: self
            });

            if (animate && _MixItUp.prototype._has._transitions) {
                self._effects = self._parseEffects();

                self._isMixing = true;

                self._getStartMixData();
                self._setInter();

                getDocumentState();

                self._getInterMixData();
                self._setFinal();
                self._getFinalMixData();

                (window.pageYOffset !== scrollTop) && window.scrollTo(scrollLeft, scrollTop);

                if (self.animation.animateResizeContainer) {
                    self._dom._parent.style.height = self._startHeight+'px';
                }

                requestAnimationFrame(performMix);
            } else {
                done();
            }
            
            self._execAction('_goMix', 1, arguments);

            return self._userPromise.promise;
        },

        /**
         * _getStartMixData
         * @since 2.0.0
         */

        _getStartMixData: function() {
            var self = this,
                parentStyle = window.getComputedStyle(self._dom._parent),
                target = null,
                data = {},
                i = -1,
                boxSizing = parentStyle.boxSizing || parentStyle[self._vendor+'BoxSizing'];
    
            self._incPadding = (boxSizing === 'border-box');

            self._execAction('_getStartMixData', 0);

            for (i = 0; target = self._show[i]; i++) {
                data = target._getPosData();

                target._startPosData = data;
            }

            for (i = 0; target = self._toHide[i]; i++) {
                data = target._getPosData();

                target._startPosData = data;
            }

            self._startHeight = self._incPadding ? 
                self._dom._parent.offsetHeight :
                self._dom._parent.offsetHeight - 
                    parseFloat(parentStyle.paddingTop) - 
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            self._execAction('_getStartMixData', 1);
        },

        /**
         * _setInter
         * @since 2.0.0
         */

        _setInter: function() {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_setInter', 0);

            for (i = 0; target = self._toShow[i]; i++) {
                target._show();
            }

            if (self._isChangingLayout) {
                _h._removeClass(self._dom._container, self.layout.containerClass);
                _h._addClass(self._dom._container, self._newContainerClass);
            }

            self._execAction('_setInter', 1);
        },

        /**
         * _getInterMixData
         * @since 2.0.0
         */

        _getInterMixData: function() {
            var self = this,
                target = null,
                data = {},
                i = -1;

            self._execAction('_getInterMixData', 0);

            for (i = 0; target = self._show[i]; i++) {
                data = target._getPosData();

                target._interPosData = data;
            }

            for (i = 0; target = self._toHide[i]; i++) {
                data = target._getPosData();

                target._interPosData = data;
            }

            self._execAction('_getInterMixData', 1);
        },

        /**
         * _setFinal
         * @since 2.0.0
         */

        _setFinal: function() {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_setFinal', 0);

            self._isSorting && self._printSort();
            
            for (i = 0; target = self._toHide[i]; i++) {
                target._hide();
            }

            self._execAction('_setFinal', 1);
        },

        /**
         * _getFinalMixData
         * @since 2.0.0
         */

        _getFinalMixData: function() {
            var self = this,
                parentStyle = window.getComputedStyle(self._dom._parent),
                target = null,
                data = {},
                i = -1;

            self._execAction('_getFinalMixData', 0);

            for (i = 0; target = self._show[i]; i++) {
                data = target._getPosData();

                target._finalPosData = data;
            }

            for (i = 0; target = self._toHide[i]; i++) {
                data = target._getPosData();

                target._finalPosData = data;
            }

            self._newHeight = self._incPadding ? 
                self._dom._parent.offsetHeight :
                self._dom._parent.offsetHeight - 
                    parseFloat(parentStyle.paddingTop) - 
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            if (self._isSorting) {
                self._printSort(true);
            }

            for (i = 0; target = self._toShow[i]; i++) {
                target._hide();
            }

            for (i = 0; target = self._toHide[i]; i++) {
                target._show();
            }

            if (self._isChangingLayout && self.animation.animateChangeLayout) {
                _h._removeClass(self._dom._container, self._newContainerClass);
                _h._addClass(self._dom._container, self.layout.containerClass);
            }

            self._execAction('_getFinalMixData', 1);
        },

        /**
         * _cleanUp
         * @since 2.0.0
         */

        _cleanUp: function() {
            var self = this,
                target = null,
                firstInQueue = null,
                i = -1;

            self._execAction('_cleanUp', 0);

            self._targetsBound = 0;
            self._targetsDone = 0;

            for (i = 0; target = self._show[i]; i++) {
                target._cleanUp();

                target._show();
                target._isShown = true;
            }

            for (i = 0; target = self._toHide[i]; i++) {
                target._cleanUp();

                target._hide();
                target._isShown = false;
            }

            if (self._isSorting) {
                self._printSort();

                self._activeSort = self._newSortString;
                self._currentOrder = self._newOrder;
                self._newOrder = [];
                self._isSorting = false;
            }

            self._dom._parent.style[_MixItUp.prototype._transitionProp] = '';
            self._dom._parent.style.height = '';

            if (self._isChangingLayout) {
                _h._removeClass(self._dom._container, self.layout.containerClass);
                _h._addClass(self._dom._container, self._newContainerClass);

                self.layout.containerClass = self._newContainerClass;
                self._isChangingLayout = false;
            }

            self._isRemoving = false;

            self._buildState();

            if (typeof self.callbacks.onMixEnd === 'function') {
                self.callbacks.onMixEnd.call(self._dom._el, self._state, self);
            }

            _h._trigger(self._dom._container, 'mixEnd', {
                state: self._state,
                instance: self
            });

            if (self._queue.length) {
                self._execAction('_queue', 0);
                
                firstInQueue = self._queue.shift();

                self._userPromise = firstInQueue[3];

                self.multiMix(firstInQueue[0], firstInQueue[1], firstInQueue[2]);
            }

            self._execAction('_cleanUp', 1);
        },

        /**
         * _getDelay
         * @since 2.0.0
         * @param {Number} i
         * @return {Number} delay
         */

        _getDelay: function(i) {
            var self = this;

            return self._execFilter('_getDelay', delay, arguments);
        },

        /**
         * _parseMultiMixArgs
         * @since 2.0.0
         * @param {Array} args
         * @return {Object} output
         */

        _parseMultiMixArgs: function(args) {
            var self = this,
                output = {
                    command: null,
                    animate: self.animation.enable,
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++){
                arg = args[i];

                if(arg !== null){
                    if(typeof arg === 'object' || typeof arg === 'string'){
                        output.command = arg;
                    } else if(typeof arg === 'boolean'){
                        output.animate = arg;
                    } else if(typeof arg === 'function'){
                        output.callback = arg;
                    }
                }
            }

            return self._execFilter('_parseMultiMixArgs', output, arguments);
        },

        /**
         * _parseInsertArgs
         * @since 2.0.0
         * @param {Array} args
         * @return {Object} output
         */

        _parseInsertArgs: function(args) {
            var self = this,
                output = {
                    index: 0,
                    collection: [],
                    multiMix: {filter: self._state.activeFilter},
                    position: '',
                    sibling: null,
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                if (typeof arg === 'number') {
                    output.index = arg;
                } if (typeof arg === 'string') {
                    output.position = arg;
                } else if (typeof arg === 'object' && _h._isElement(arg)) {
                    !output.collection.length ?
                        (output.collection = [arg]) :
                        (output.sibling = arg);
                } else if (typeof arg === 'object' && arg !== null && arg.length) {
                    !output.collection.length ?
                        (output.collection = arg) :
                        output.sibling = arg[0];
                } else if (typeof arg === 'object' && arg !== null && arg.childNodes && arg.childNodes.length) {
                        !output.collection.length ?
                            output.collection = Array.prototype.slice.call(arg.childNodes) :
                            output.sibling = arg.childNodes[0];
                } else if (typeof arg === 'object' && arg !== null) {
                    output.multiMix = arg;
                } else if (typeof arg === 'boolean' && !arg) {
                    output.multiMix = false;
                } else if (typeof arg === 'function') {
                    output.callback = arg;
                }
            }

            if (!output.collection.length && _h._canReportErrors(self)) {
                throw new Error('[MixItUp] No elements were passed to "insert"');
            }

            return self._execFilter('_parseInsertArgs', output, arguments);
        },

        /**
         * _parseRemoveArgs
         * @since 3.0.0
         * @param {Array} args
         * @return {Object} output
         */

        _parseRemoveArgs: function(args) {
            var self = this,
                output = {
                    index: -1,
                    selector: '',
                    collection: [],
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                switch (typeof arg) {
                    case 'number':
                        output.index = arg;

                        break;
                    case 'string':
                        output.selector = arg;

                        break;
                    case 'object':
                        if (arg && arg.length) {
                            output.collection = arg;
                        } else if (_h._isElement(arg)) {
                            output.collection = [arg];
                        }

                        break;
                    case 'function':
                        output.callback = arg;

                        break;
                }
            }

            return self._execFilter('_parseRemoveArgs', output, arguments);
        },

        /**
         * _execAction
         * @since 2.0.0
         * @param {String} methodName
         * @param {Boolean} isPost
         * @param {Array} args
         */

        _execAction: function(methodName, isPost, args) {
            var self = this,
                key = '',
                context = isPost ? 'post' : 'pre';

            if (!self._actions.isEmptyObject && self._actions.hasOwnProperty(methodName)) {
                for (key in self._actions[methodName][context]) {
                    self._actions[methodName][context][key].call(self, args);
                }
            }
        },

        /**
         * _execFilter
         * @since 2.0.0
         * @param {String} methodName
         * @param {Mixed} value
         * @param {Array} args
         * @return {Mixed} value
         */

        _execFilter: function(methodName, value, args) {
            var self = this,
                key = '';
            
            if (!self._filters.isEmptyObject && self._filters.hasOwnProperty(methodName)) {
                for (key in self._filters[methodName].pre) {
                    return self._filters[methodName].pre[key].call(self, value, args);
                }
            } else {
                return value;
            }
        },

        /**
         * _deferMix
         * @since 3.0.0
         * @param {Mixed[]} args
         * @param {Object} parsedArgs
         * @return {Promise} -> {State}
         */

        _deferMix: function(args, parsedArgs) {
            var self = this;

            self._userPromise = _h._getPromise(self.libraries);

            if (self.animation.queue && self._queue.length < self.animation.queueLimit) {
                args[3] = self._userPromise;

                self._queue.push(args);
                
                (self.controls.enable && !self._isClicking) && self._updateControls(parsedArgs.command);
                
                self._execAction('multiMixQueue', 1, args);
            } else {
                self._userPromise.resolve(self._state); // TODO: include warning that was busy in state?
                self._userPromise.isResolved = true;

                if (typeof self.callbacks.onMixBusy === 'function') {
                    self.callbacks.onMixBusy.call(self._dom._container, self._state, self);
                }

                _h._trigger(self._dom._container, 'mixBusy', {
                    state: self._state,
                    instance: self
                });
                
                self._execAction('multiMixBusy', 1, args);
            }

            return self._userPromise.promise;
        },

        /* Public Methods
        ---------------------------------------------------------------------- */

        /**
         * init
         * @since 3.0.0
         * @return {Promise} --> {Object} state
         */

        init: function() {
            var self = this;

            return self._goMix(self.animation.enable);
        },

        /**
         * isMixing
         * @since 2.0.0
         * @return {Boolean}
         */

        isMixing: function() {
            var self = this;

            return self._isMixing;
        },

        /**
         * filter
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        filter: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments);

            self._isClicking && (self._toggleString = '');
            
            return self.multiMix({filter: args.command}, args.animate, args.callback);
        },
        
        /**
         * sort
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */
        
        sort: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments);

            return self.multiMix({sort: args.command}, args.animate, args.callback);
        },

        /**
         * changeLayout
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Mixed[]} arguments
         * @return {Promise} -> {State}
         */

        changeLayout: function() {
            var self = this;

            // TODO: map to multiMix
        },

        /**
         * multiMix
         * @since 2.0.0
         * @param {Mixed[]} arguments
         * @return {Promise} -> {State}
         */

        multiMix: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments),
                sort = args.command.sort,
                filter = args.command.filter,
                changeLayout = args.command.changeLayout;

            self._execAction('multiMix', 0, arguments);

            if (!self._isMixing) {
                if (self.controls.enable && !self._isClicking && !self._isRemoving) {
                    self._dom._filterToggleButtons.length && self._buildToggleArray(); // TODO: what about "live" toggles?

                    self._updateControls(args.command);
                }

                (self._queue.length < 2) && (self._isClicking = false);

                delete self.callbacks._user;

                if (args.callback) self.callbacks._user = args.callback;

                if (sort !== undf) {
                    self._newSort = self._parseSort(sort);
                    self._newSortString = sort;

                    if (sort !== self._activeSort || sort === 'random') {
                        self._isSorting = true;
                        self._sort();
                    }
                }

                if (filter !== undf) {
                    filter = (filter === 'all') ? self.selectors.target : filter;

                    self._activeFilter = filter;
                }

                self._filter();

                if (changeLayout !== undf) {
                    self._newContainerClass = typeof changeLayout === 'string' ? changeLayout : '';

                    if (
                        self._newContainerClass !== self.layout.containerClass
                    ) {
                        self._isChangingLayout = true;
                    }
                }

                self._execAction('multiMix', 1, arguments);

                return self._goMix(args.animate ^ self.animation.enable ? args.animate : self.animation.enable);
            } else {
                return self._deferMix(arguments);
            }
        },

        /**
         * insert
         * @since 2.0.0
         * @param {Array} arguments
         * @return {Promise}
         */

        insert: function() {
            var self = this,
                args = self._parseInsertArgs(arguments),
                callback = (typeof args.callback === 'function') ? args.callback : null,
                frag = _doc.createDocumentFragment(),
                target = null,
                nextSibling = (function() { 
                    if (args.position === 'before') {
                        return args.sibling;
                    }

                    if (args.position === 'after') {
                        return args.sibling.nextElementSibling || null;
                    }

                    if (self._targets.length) {
                        return (args.index < self._targets.length || !self._targets.length) ? 
                            self._targets[args.index]._dom._el :
                            self._targets[self._targets.length - 1]._dom._el.nextElementSibling;
                    } else {
                        return self._dom._parent.children.length ? self._dom._parent.children[0] : null;
                    }
                })(),
                el = null,
                i = -1;

            // TODO: insert and remove must be queuable independently of their multimix calls

            // TODO: throw error if user attempts to insert element that is already a target
                        
            self._execAction('insert', 0, arguments);

            if (args.collection) {
                for (i = 0; el = args.collection[i]; i++) {                    
                    frag.appendChild(el);
                    frag.appendChild(_doc.createTextNode(' '));

                    if (!_h._isElement(el) || !el.matches(self.selectors.target)) continue;

                    target = new _Target();

                    target._init(el, self);

                    self._targets.splice(args.index, 0, target);
                }

                self._dom._parent.insertBefore(frag, nextSibling);
            }

            self._currentOrder = self._origOrder = self._targets;

            self._execAction('insert', 1, arguments);

            if (typeof args.multiMix === 'object') {
                return self.multiMix(args.multiMix, callback);
            }
        },

        /**
         * insertBefore
         * @since 3.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise}
         */

        insertBefore: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);
            
            return self.insert(0, args.collection, args.multiMix, 'before', args.sibling, args.callback);
        },

        /**
         * insertAfter
         * @since 3.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise}
         */

        insertAfter: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);
            
            return self.insert(0, args.collection, args.multiMix, 'after', args.sibling, args.callback);
        },

        /**
         * prepend
         * @since 2.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise}
         */

        prepend: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);
            
            return self.insert(0, args.collection, args.multiMix, args.callback);
        },

        /**
         * append
         * @since 2.0.0
         * @shorthand self.insert
         * @param {array} arguments
         * @return {Promise}
         */

        append: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);
            
            return self.insert(self._state.totalTargets, args.collection, args.multiMix, args.callback);
        },

        /**
         * remove
         * @since 3.0.0
         * @param {Array} arguments
         * @return {Promise}
         */

        remove: function() {
            var self = this,
                args = self._parseRemoveArgs(arguments),
                activeFilterStart = '',
                multiMix = {
                    filter: {
                        hide: null
                    }
                },
                target = null,
                i = -1,
                cleanUp = function(state) {
                    if (args.collection.length) {
                        for (i = 0; target = self._targets[i]; i++) {
                            if (args.collection.indexOf(target._dom._el) > -1) {
                                _h._deleteElement(target._dom._el);

                                self._targets.splice(i, 1);

                                i--;
                            }
                        }
                    } else if (args.index > -1 && self._targets[args.index]) {
                        _h._deleteElement(self._targets[args.index]._dom._el);

                        self._targets.splice(args.index, 1);
                    } else if (args.selector) {
                        for (i = 0; target = self._targets[i]; i++) {
                            if (target._dom._el.matches(args.selector)) {
                                _h._deleteElement(target._dom._el);

                                self._targets.splice(i, 1);

                                i--;
                            }
                        }
                    }

                    self._currentOrder = self._origOrder = self._targets;

                    self._activeFilter = activeFilterStart;
                    self._filter();
                    
                    self._buildState();

                    return self._state;
                };

            self._execAction('remove', 0, arguments);

            activeFilterStart = self.getState().activeFilter;

            self._isRemoving = true;

            if (args.collection.length) {
                multiMix.filter.hide = args.collection;
            } else if (args.index > -1 && self._targets[args.index]) {
                multiMix.filter.hide = self._targets[args.index]._dom._el;
            } else if (args.selector) {
                multiMix.filter.hide = args.selector;
            }

            self._execAction('remove', 1, arguments);

            return self.multiMix(multiMix, args.callback)
                .then(cleanUp); // TODO: use a normal callback here for browser support!
        },

        /**
         * getOption
         * @since 2.0.0
         * @param {String} string
         * @return {Mixed} value
         */

        getOption: function(string) {
            var self = this;

        },

        /**
         * setOptions
         * @since 2.0.0
         * @param {Object} config
         */

        setOptions: function(config) {
            var self = this;

            self._execAction('setOptions', 0, arguments);

            self._execAction('setOptions', 1, arguments);
        },

        /**
         * getState
         * @since 2.0.0
         * @return {Object} state
         */

        getState: function() {
            var self = this;

            return self._execFilter('getState', self._state, self);
        },

        /**
         * forceRefresh
         * @since 2.1.2
         */

        forceRefresh: function() {
            var self = this;

            self._indexTargets();
        },

        /**
         * destroy
         * @since 2.0.0
         * @param {Boolean} hideAll
         */

        destroy: function(hideAll) {
            var self = this,
                target = null,
                button = null,
                i = 0;

            self._execAction('destroy', 0, arguments);

            self._unbindEvents();

            for (i = 0; target = self._targets[i]; i++) {
                hideAll && target._hide();

                target._unbindEvents();
            }

            for (i = 0; button = self._dom._allButtons[i]; i++) {
                _h._removeClass(button, self.controls.activeClass);
            }

            if (self._dom._container.id.indexOf('MixItUp') > -1) { // TODO: use a regex 
                self._dom._container.id = '';
            }

            delete _MixItUp.prototype._instances[self.id];

            self._execAction('destroy', 1, arguments);
        }
    };

    /* _Target Core
    ---------------------------------------------------------------------- */

    /**
     * _Target
     * @constructor
     * @since 3.0.0
     */

    _Target = function() {
        var self = this;

        self._execAction('_constructor', 0, arguments);

        _h._extend(self, {
            _sortString: '',
            _mixer: null,
            _callback: null,
            _startPosData: null,
            _interPosData: null,
            _finalPosData: null,
            _isShown: false,
            _isBound: false,
            _isExcluded: false,

            _dom: {
                _el: null
            }
        });

        self._execAction('_constructor', 1, arguments);
    };

    /**
     * _Target.prototype
     * @prototype
     * @since 3.0.0
     */

    _Target.prototype = {
        constructor: _Target,

        /* Static Properties
        ---------------------------------------------------------------------- */

        _actions: {},
        _filters: {},

        /* Public Static Methods
        ---------------------------------------------------------------------- */

        /**
         * extend
         * @since 3.0.0
         * @param {Object} new properties/methods
         * @extends {Object} prototype
         *
         * Shallow extend a target with new methods
         */

        extend: function(extension) {
            var key = '';

            for(key in extension){
                _Target.prototype[key] = extension[key];
            }
        },

        /**
         * addAction
         * @since 3.0.0
         * @param {String} hook name
         * @param {String} method
         * @param {Function} function to execute
         * @param {Number} priority
         * @extends {Object} _MixItUp.prototype._actions
         *
         * Register a named action hook on the Target prototype
         */

        addAction: function(hook, name, func, priority) {
            _Target.prototype._addHook('_actions', hook, name, func, priority);
        },

        /**
         * addFilter
         * @since 3.0.0
         * @param {string} hook name
         * @param {string} method
         * @param {function} function to execute
         * @extends {object} _MixItUp.prototype._filters
         *
         * Register a named filter hook on the Target prototype
         */

        addFilter: function(hook, name, func) {
            _Target.prototype._addHook('_filters', hook, name, func);
        },

        /* Private Static Methods
        ---------------------------------------------------------------------- */

        /**
         * _addHook
         * @since 3.0.0
         * @param {String} type of hook
         * @param {String} hook name
         * @param {Function} function to execute
         * @param [{Number}] priority
         * @extends {Object} _MixItUp.prototype._filters
         *
         * Add a hook to the Target prototype
         */

        _addHook: function(type, hook, name, func, priority) {
            var collection = _Target.prototype[type],
                obj = {};

            priority = (priority === 1 || priority === 'post') ? 'post' : 'pre';

            obj[hook] = {};
            obj[hook][priority] = {};
            obj[hook][priority][name] = func;

            _h._extend(collection, obj);
        },

        /**
         * _execAction
         * @alias _MixItUp.prototype._execAction
         */

        _execAction: _MixItUp.prototype._execAction,

        /**
         * _execFilter
         * @alias _MixItUp.prototype._execAction
         */

        _execFilter: _MixItUp.prototype._execFilter,

        /* Private Instance Methods
        ---------------------------------------------------------------------- */

        /**
         * _init
         * @since 3.0.0
         * @param {Object} element
         * @param {Object} mixer
         *
         * Initialize a newly instantiated Target
         */

        _init: function(el, mixer) {
            var self = this;

            self._execAction('_init', 0, arguments);

            self._mixer = mixer;

            self._cacheDom(el);

            self._bindEvents();

            !!self._dom._el.style.display && (self._isShown = true);

            self._execAction('_init', 1, arguments);
        },

        /**
         * cacheDom
         * @since 3.0.0
         * @param {Object} element
         *
         * Cache any DOM elements from the target context inwards
         */

        _cacheDom: function(el) {
            var self = this;

            self._execAction('_cacheDom', 0, arguments);

            self._dom._el = el;

            self._execAction('_cacheDom', 1, arguments);
        },

        /**
         * _getSortString
         * @param {String} attributeName
         * @since 3.0.0
         */

        _getSortString: function(attributeName) {
            var self = this,
                value = self._dom._el.getAttribute('data-'+attributeName) || '';

            self._execAction('_getSortString', 0, arguments);

            value = isNaN(value * 1) ?
                value.toLowerCase() :
                value * 1;

            self._sortString = value;

            self._execAction('_getSortString', 1, arguments);
        },

        /**
         * _show
         * @param {Boolean} animate
         * @since 3.0.0
         */

        _show: function(animate) {
            var self = this;

            self._execAction('_show', 0, arguments);

            !self._dom._el.style.display && (self._dom._el.style.display = self._mixer.layout.display);

            self._execAction('_show', 1, arguments);
        },

        /**
         * _hide
         * @param {Boolean} animate
         * @since 3.0.0
         */

        _hide: function(animate) {
            var self = this;

            self._execAction('_hide', 0, arguments);

            self._dom._el.style.display = '';

            self._execAction('_hide', 1, arguments);
        },

        /**
         * _move         
         * @param {Object} options
         * @since 3.0.0
         */

        _move: function(options) {
            var self = this;

            self._execAction('_move', 0, arguments);

            self._applyStylesIn({
                posIn: options.posIn,
                hideOrShow: options.hideOrShow
            });

            requestAnimationFrame(function() {
                self._applyStylesOut({
                    posIn: options.posIn,
                    posOut: options.posOut,
                    hideOrShow: options.hideOrShow,
                    staggerIndex: options.staggerIndex,
                    duration: options.duration,
                    callback: options.callback
                });
            });

            self._execAction('_move', 1, arguments);
        },

        /**
         * _applyStylesIn
         * @param {Object} options
         *
         * Applies starting styles to a target element
         * before any transition is applied
         */

        _applyStylesIn: function(options) {
            var self = this,
                isFading = self._mixer._effects.opacity !== undf,
                transformValues = [];

            transformValues.push('translate(' + options.posIn.x + 'px, ' + options.posIn.y + 'px)'); 

            if (!options.hideOrShow && self._mixer.animation.animateResizeTargets) {
                self._dom._el.style.width        = options.posIn.width + 'px';
                self._dom._el.style.height       = options.posIn.height + 'px';
                self._dom._el.style.marginRight  = options.posIn.marginRight + 'px';
                self._dom._el.style.marginBottom = options.posIn.marginBottom + 'px';
            }

            switch (options.hideOrShow) {
                case 'hide':
                    isFading && (self._dom._el.style.opacity = 1);

                    break;
                case 'show':
                    isFading && (self._dom._el.style.opacity = self._mixer._effects.opacity);

                    transformValues.push(self._mixer._effects.transformIn);
            }

            self._dom._el.style[_MixItUp.prototype._transformProp] = transformValues.join(' ');
        },

        /**
         * _applyStylesOut
         * @param {Object} options
         *
         * Applies a transition and the corresponding styles to
         * transition towards
         */

        _applyStylesOut: function(options) {
            var self            = this,
                transitionRules = [],
                transformValues = [],
                isResizing      = self._mixer.animation.animateResizeTargets,
                isFading        = self._mixer._effects.opacity !== undf;

            // Build the transition rules

            transitionRules.push(self._writeTransitionRule(
                _MixItUp.prototype._transformRule,
                options.staggerIndex
            ));

            if (options.hideOrShow) {
                transitionRules.push(self._writeTransitionRule(
                    'opacity',
                    options.staggerIndex,
                    options.duration
                ));
            }

            if (self._mixer.animation.animateResizeTargets && self._finalPosData && self._finalPosData.isShown) {
                transitionRules.push(self._writeTransitionRule(
                    'width',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self._writeTransitionRule(
                    'height',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self._writeTransitionRule(
                    'margin',
                    options.staggerIndex,
                    options.duration
                ));
            }

            // Bind transitionEnd

            if (
                self._willTransition(options)
            ) {
                // If the target will transition in some fasion,
                // assign a callback function

                self._callback = options.callback;

                // As long as the target is not excluded, increment
                // the total number of targets bound

                !self._isExcluded && self._mixer._targetsBound++;

                // Tag the target as bound to differentiate from transitionEnd
                // events that may come from stylesheet driven effects 

                self._isBound = true;
            }

            // Apply the transition

            self._applyTransition(transitionRules);

            // Apply width, height and margin negation

            if (self._mixer.animation.animateResizeTargets && self._finalPosData && self._finalPosData.isShown) {
                self._dom._el.style.width        = options.posOut.width + 'px';
                self._dom._el.style.height       = options.posOut.height+ 'px';
                self._dom._el.style.marginRight  = options.posOut.marginRight + 'px';
                self._dom._el.style.marginBottom = options.posOut.marginBottom + 'px';
            }

            // Apply fade

            switch (options.hideOrShow) {
                case 'hide':
                    isFading && (self._dom._el.style.opacity = self._mixer._effects.opacity);

                    transformValues.push(self._mixer._effects.transformOut);

                    break;
                case 'show':
                    isFading && (self._dom._el.style.opacity = 1);
            }

            // Apply transforms

            transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');

            self._dom._el.style[_MixItUp.prototype._transformProp] = transformValues.join(' ');
        },

        /**
         * _willTransition
         * @param {Object} options
         * @return {Boolean}
         *
         * Determines if a target element will transition in
         * some fasion and therefore requires binding of
         * transitionEnd
         */

        _willTransition: function(options) {
            var self = this,
                canResize = self._mixer.animation.animateResizeTargets;

            // Check if opacity and/or translate will change

            if (
                options.hideOrShow ||
                options.posIn.x !== options.posOut.x ||
                options.posIn.y !== options.posOut.y
            ) {
                return true;
            } else if (canResize) {
                // Check if width, height or margins will change

                return (
                    options.posIn.width !== options.posOut.width ||
                    options.posIn.height !== options.posOut.height ||
                    options.posIn.marginRight !== options.posOut.marginRight ||
                    options.posIn.marginTop !== options.posOut.marginTop
                );
            }
        },

        /**
         * _writeTransitionRule
         * @param {String} rule
         * @param {Number} staggerIndex
         * @param [{Number}] duration
         * @return {String}
         *
         * Combines the name of a rule with duration and delay values
         * to produce a valid transition value
         */

        _writeTransitionRule: function(rule, staggerIndex, duration) {
            var self = this,
                delay = staggerIndex * self._mixer._staggerDuration,
                output = '';

            output = rule + ' ' +
                (duration || self._mixer.animation.duration) + 'ms ' +
                delay + 'ms ' +
                (rule === 'opacity' ? 'linear' : self._mixer.animation.easing);

            return output;
        },

        /**
         * _applyTransition
         * @param {Array} rules
         * @since 3.0.0
         */

        _applyTransition: function(rules) {
            var self = this,
                transitionString = rules.join(', ');

            self._execAction('_transition', 0, arguments);

            self._dom._el.style[_MixItUp.prototype._transitionProp] = transitionString;

            self._execAction('_transition', 1, arguments);
        },

        /**
         * handleTransitionEnd
         * @since 3.0.0
         */

        _handleTransitionEnd: function(e) {
            var self = this,
                propName = e.propertyName,
                isResizing = self._mixer.animation.animateResizeTargets;

            self._execAction('_handleTransitionEnd', 0, arguments);

            if (
                self._isBound &&
                e.target.matches(self._mixer.selectors.target) &&
                (
                    propName.indexOf('transform') > -1 ||
                    propName.indexOf('opacity') > -1 ||
                    isResizing && propName.indexOf('height') > -1 ||
                    isResizing && propName.indexOf('width') > -1 ||
                    isResizing && propName.indexOf('margin') > -1
                )
            ) {
                self._callback.call(self);
                
                self._isBound = false;
                self._callback = null;
            }

            self._execAction('_handleTransitionEnd', 1, arguments);
        },

        /**
         * _eventBus
         * @since 3.0.0
         * @param {Object} e
         */

        _eventBus: function(e) {
            var self = this;

            self._execAction('_eventBus', 0, arguments);

            switch (e.type) {
                case 'webkitTransitionEnd':
                case 'transitionend':

                    self._handleTransitionEnd(e);
            }

            self._execAction('_eventBus', 1, arguments);
        },

        /**
         * _unbindEvents
         * @since 3.0.0
         */

        _unbindEvents: function() {
            var self = this;

            self._execAction('_unbindEvents', 0, arguments);

            _h._off(self._dom._el, 'webkitTransitionEnd', self._handler);
            _h._off(self._dom._el, 'transitionEnd', self._handler);

            self._execAction('_unbindEvents', 1, arguments);

            delete self._handler;
        },

        /**
         * _bindEvents
         * @since 3.0.0
         */

        _bindEvents: function() {
            var self = this,
                transitionEndEvent = self._mixer._transitionPrefix === 'webkit' ?
                    'webkitTransitionEnd' :
                    'transitionend';

            self._execAction('_bindEvents', 0, arguments);

            self._handler = function(e) {
                return self._eventBus(e);
            };

            _h._on(self._dom._el, transitionEndEvent, self._handler);

            self._execAction('_bindEvents', 1, arguments);
        },

        /**
         * _getPosData
         * @since 3.0.0
         */

        _getPosData: function() {
            var self = this,
                styles = {},
                posData = {
                    x: self._dom._el.offsetLeft,
                    y: self._dom._el.offsetTop,
                    width: self._dom._el.offsetWidth,
                    height: self._dom._el.offsetHeight,
                    isShown: !!self._dom._el.style.display
                };

            self._execAction('_getPosData', 0, arguments);

            if (self._mixer.animation.animateResizeTargets) {
                styles = window.getComputedStyle(self._dom._el);

                posData.marginBottom = parseFloat(styles.marginBottom);
                posData.marginRight = parseFloat(styles.marginRight);
            }

            return self._execFilter('_getPosData', posData, arguments);
        },

        /**
         * _cleanUp
         */

        _cleanUp: function() {
            var self = this;

            self._execAction('_cleanUp', 0, arguments);

            self._dom._el.style[_MixItUp.prototype._transformProp] = '';
            self._dom._el.style[_MixItUp.prototype._transitionProp] = '';
            self._dom._el.style.opacity = '';

            if (self._mixer.animation.animateResizeTargets) {
                self._dom._el.style.width = '';
                self._dom._el.style.height = '';
                self._dom._el.style.marginRight = '';
                self._dom._el.style.marginBottom = '';
            }

            self._execAction('_cleanUp', 1, arguments);
        }
    };

    /* Helper Library
    ---------------------------------------------------------------------- */

    _h = {

        /**
         * _hasClass
         * @since 3.0.0
         * @param {Object} el
         * @param {String} cls
         */

        _hasClass: function(el, cls) {
            return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
        },

        /**
         * _addClass
         * @since 3.0.0
         * @param {Object} el
         * @param {String} cls
         */

        _addClass: function(el, cls) {
            if (!this._hasClass(el, cls)) el.className += el.className ? ' '+cls : cls;
        },

        /**
         * _removeClass
         * @since 3.0.0
         * @param {Object} el
         * @param {String} cls
         */

        _removeClass: function(el, cls) {
            if (this._hasClass(el, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                el.className = el.className.replace(reg, ' ').trim();
            }
        },

        /**
         * _extend
         * @since 3.0.0
         * @param {Object} destination
         * @param {Object} source
         */

        _extend: function(destination, source) {
            var property = '';

            for (property in source) {
                if (
                    typeof source[property] === "object" && 
                    source[property] !== null &&
                    typeof source[property].length === 'undefined'
                ) {
                    destination[property] = destination[property] || {};

                    this._extend(destination[property], source[property]);
                } else {
                    destination[property] = source[property];
                }
            }
        },

        /**
         * _on
         * @since 3.0.0
         * @param {Object} el
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} useCapture
         */

        _on: function(el, type, fn, useCapture) {
            if (!el) return;

            if (el.attachEvent) {
                el['e'+type+fn] = fn;
                el[type+fn] = function(){el['e'+type+fn](window.event);};
                el.attachEvent('on'+type, el[type+fn]);
            } else
                el.addEventListener(type, fn, useCapture);
        },

        /**
         * _off
         * @since 3.0.0
         * @param {Object} el
         * @param {String} type
         * @param {Function} fn
         */

        _off: function(el, type, fn) {
            if (!el) return;
            
            if (el.detachEvent) {
                el.detachEvent('on'+type, el[type+fn]);
                el[type+fn] = null;
            } else
                el.removeEventListener(type, fn, false);
        },

        /**
         * _trigger
         * @param {Object} element
         * @param {String} eventName
         * @param {Object} data
         */

        _trigger: function(el, eventName, data) {
            var event = null;

            if (typeof window.CustomEvent === 'function') {
                event = new CustomEvent(eventName, {detail: data});
            } else {
                event = _doc.createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, data);
            }

            el.dispatchEvent(event);
        },

        /**
         * _index 
         * @since 3.0.0
         * @param {Object} el
         * @param {String} selector
         */

        _index: function(el, selector) {
            var i = 0;

            while((el = el.previousElementSibling)!== null) {
                if (!selector || el.matches(selector)) {
                    ++i;   
                }
            }
            return i;
        },

        /**
         * _camelCase
         * @since 2.0.0
         * @param {string}
         * @return {string}
         */

        _camelCase: function(string) {
            return string.replace(/-([a-z])/g, function(g) {
                    return g[1].toUpperCase();
            });
        },

        /**
         * _isElement
         * @since 2.1.3
         * @param {Object} element to test
         * @return {Boolean}
         */

        _isElement: function(el) {
            if (
                window.HTMLElement &&
                el instanceof HTMLElement
            ) {
                return true;
            } else if (
                _doc.defaultView &&
                _doc.defaultView.HTMLElement &&
                el instanceof _doc.defaultView.HTMLElement
            ) {
                return true;
            } else {
                return (
                    el !== null && 
                    el.nodeType === 1 &&
                    el.nodeName === 'string'
                );
            }
        },

        /**
         * _createElement
         * @since 3.0.0
         * @param {String} htmlString
         */

        _createElement: function(htmlString) {
            var frag = _doc.createDocumentFragment(),
                temp = _doc.createElement('div');

            temp.innerHTML = htmlString;

            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }

            return frag;
        },

        /**
         * _deleteElement
         * @since 3.0.0
         * @param {Object} el
         */

        _deleteElement: function(el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        },

        /**
         * _isEqualArray
         * @since 3.0.0
         * @param {Array} a
         * @param {Array} b
         */

        _isEqualArray: function(a, b) {
            var i = a.length;

            if (i !== b.length) return false;

            while (i--) {
                if (a[i] !== b[i]) return false;
            }
            
            return true;
        },

        /**
         * _arrayShuffle
         * @since 2.0.0
         * arrayShuffle
         * @param {Array} oldArray
         * @return {Array}
         */

        _arrayShuffle: function(oldArray) {
            var newArray = oldArray.slice(),
                len = newArray.length,
                i = len;

            while (i--) {
                var p = parseInt(Math.random() * len),
                    t = newArray[i];

                newArray[i] = newArray[p];
                newArray[p] = t;
            }

            return newArray; 
        },

        /**
         * _debounce
         * @since 3.0.0
         * @param {Function} func
         * @param {Number} wait
         * @param {Boolean} immediate
         */

        _debounce: function(func, wait, immediate) {
            var timeout;

            return function() {
                var context = this, 
                    args = arguments,
                    later = function() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    },
                    callNow = immediate && !timeout;

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);

                if (callNow) func.apply(context, args);
            };
        },

        /**
         * _position
         * @since 3.0.0
         * @param {Object} element
         * @return {Object} position
         */

        _position: function(element) {
            var xPosition = 0,
                yPosition = 0,
                offsetParent = element;
                
            while (element) {
                xPosition -= element.scrollLeft;
                yPosition -= element.scrollTop;

                if (element === offsetParent) {
                    xPosition += element.offsetLeft;
                    yPosition += element.offsetTop;

                    offsetParent = element.offsetParent;
                }

                element = element.parentElement;
            }

            return {
                x: xPosition,
                y: yPosition
            };
        },

        /**
         * _getHypotenuse
         * @since 3.0.0
         * @param {Object} node1
         * @return {Object} node2
         * @return {Number} hypotenuse
         */

        _getHypotenuse: function(node1, node2) {
            var distanceX = node1.x - node2.x,
                distanceY = node1.y - node2.y;

            distanceX = distanceX < 0 ? distanceX * -1 : distanceX,
            distanceY = distanceY < 0 ? distanceY * -1 : distanceY;

            return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
        },

        /**
         * _closestParent
         * @since 3.0.0
         * @param {Object} el
         * @param {String} selector
         * @param {Boolean} includeSelf
         * @param {Number} range
         */

        _closestParent: function(el, selector, includeSelf, range) {
            var parent = el.parentNode,
                depth = range || true;

            if (includeSelf && el.matches(selector)) {
                return el;
            }

            while (depth && parent && parent != _doc.body) {
                if (parent.matches && parent.matches(selector)) {
                    return parent;
                } else if (parent.parentNode) {
                    parent = parent.parentNode;
                } else {
                    return null;
                }

                if (range) {
                    depth--;
                }
            }

            return null;
        },

        /**
         * _children
         * @since 3.0.0
         * @param {Object} el
         * @param {String} selector
         */

        _children: function(el, selector) {
            var children = [],
                tempId = '';

            if (el) {
                if (!el.id) {
                    tempId = 'Temp'+this.random();

                    el.id = tempId;
                }

                children = _doc.querySelectorAll('#' + el.id + ' > '+selector);

                if (tempId) {
                    el.removeAttribute('id');
                }
            }
            
            return children;
        },

        /**
         * _forEach
         * @since 3.0.0
         * @param {Array} items
         * @param {Function} callback(item)
         */

        _forEach: function(items, callback) {
            for (var i = 0, item; item = items[i]; i++) {
                (typeof callback === 'function') && callback.call(this, item);
            }
        },

        /**
         * _clean
         * @since 3.0.0
         * @param {Array} originalArray
         * @return {Array} cleanArray
         */

        _clean: function(originalArray) {
            var cleanArray = [];

            for (var i = 0; i < originalArray.length; i++) {
                if (originalArray[i]) {
                    cleanArray.push(originalArray[i]);
                }
            }

            return cleanArray;
        },

        /**
         * _getPromise
         * @since 3.0.0
         * @return {Object} libraries
         * @return {Object} promiseWrapper
         */

        _getPromise: function(libraries) {
            var promise = {
                promise: null,
                resolve: null,
                reject: null,
                isResolved: false
            };

            if (_MixItUp.prototype._has._promises) {
                promise.promise = new Promise(function(resolve, reject) {
                    promise.resolve = resolve;
                    promise.reject = reject;
                });
            } else if (libraries.q && typeof libraries.q === 'function') {
                var defered = libraries.q.defer();
                promise.promise = defered.promise;
                promise.resolve = defered.resolve;
                promise.reject = defered.reject;
            } else {
                console.warn('[MixItUp] WARNING: No available Promises implementations were found');

                return null;
            }

            return promise;
        },

        /**
         * _canReportErrors
         * @since 3.0.0
         * @param [{Object}] config
         * @return {Boolean}
         */

        _canReportErrors: function(config) {
            if (!config || config && !config.debug) {
                return true;
            } else if (config && config.debug && config.debug.enable === false) {
                return false;
            }
        },

        /**
         * _getPrefix
         * @since 2.0.0
         * @param {Element} el,
         * @param {String} property
         * @param {String[]} vendors
         * @return {String | Boolean}
         */

        _getPrefix: function(el, property, vendors) {
            var i = -1,
                prefix = '';

            if (property.toLowerCase() in el.style) return '';

            for (i = 0; prefix = vendors[i]; i++) {
                if (prefix + property in el.style) {
                    return prefix.toLowerCase();
                }
            }

            return false;
        },

        /**
         * _negateValue
         * @param {String} value
         * @param {Boolean} invert
         * @return {String}
         */

        _negateValue: function(value, invert) {
            if (invert) {
                return value.charAt(0) === '-' ?
                    value.substr(1, value.length) :
                    '-' + value;
            } else {
                return value;
            }
        },

        /**
         * _randomHexKey
         * @return {String}
         */

        _randomHexKey: function() {
            return (
                '00000' +
                (Math.random() * 16777216 << 0).toString(16)
            )
                .substr(-6)
                .toUpperCase();
        }
    };

    /* mixItUp Factory
    ---------------------------------------------------------------------- */

    /**
     * mixItUp
     * @since 3.0.0
     * @factory
     * @param {Object|String} container
     * @param [{Object}] configuration
     * @param [{Object}] doc
     * @return {Object}
     */

    mixItUp = function(container, config, doc) {
        var el = null,
            instance = null,
            id = '',
            name = '',
            rand = _h._randomHexKey();

        _doc = doc || document;

        if (config && typeof config.extensions === 'object') {
            for (name in config.extensions) {
                config.extensions[name](_MixItUp);
            }
        }

        switch (typeof container) {
            case 'string':
                el = _doc.querySelectorAll(container)[0];

                break;
            case 'object':
                el = container;

                break;
        }

        if (!el && _h._canReportErrors(config)) {
            throw new Error('[MixItUp] Invalid selector or element');            
        }

        if (!el.id) {
            id = 'MixItUp' + rand();

            el.id = id;
        } else {
            id = el.id;
        }

        if (_MixItUp.prototype._instances[id] === undf) {
            // todo: check that el has been touched by mixitup

            instance = new _MixItUp(el, config);

            instance._init(el, config);

            _MixItUp.prototype._instances[id] = instance;
        } else if (_MixItUp.prototype._instances[id] instanceof _MixItUp) {
            instance = _MixItUp.prototype._instances[id];

            if (config && _h._canReportErrors(config)) {
                console.warn('[MixItUp] This element already has an active instance. Config will be ignored.');
            }
        }

        return instance;
    };

    _MixItUp.prototype._featureDetect();

    _MixItUp.prototype._Target = _Target;
    _MixItUp.prototype._h = _h;

    mixItUp.prototype._MixItUp = _MixItUp;

    /* Module Definitions
    ---------------------------------------------------------------------- */

    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = mixItUp;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return mixItUp;
        });
    } else if (window.mixItUp === undf || typeof window.mixItUp !== 'function') {
        window.mixItUp = mixItUp;
    }
})(window, document);