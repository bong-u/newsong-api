
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function (exports) {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/list.svelte generated by Svelte v3.46.4 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/list.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (68:3) {:catch error}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "오류가 발생했습니다.";
    			add_location(p, file$3, 68, 5, 1573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(68:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (58:1) {:then items }
    function create_then_block(ctx) {
    	let div;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "itemView");
    			add_location(div, file$3, 58, 5, 1239);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, deleteItem*/ 3) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(58:1) {:then items }",
    		ctx
    	});

    	return block;
    }

    // (60:3) {#each items as item, index}
    function create_each_block$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*item*/ ctx[4].name.replace(/ \([\s\S]*?\)/g, '') + "";
    	let t1;
    	let t2;
    	let div1_id_value;
    	let div1_name_value;
    	let div1_image_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 61, 5, 1377);
    			attr_dev(div0, "class", "itemName");
    			add_location(div0, file$3, 62, 5, 1439);
    			attr_dev(div1, "class", "item");
    			attr_dev(div1, "id", div1_id_value = /*item*/ ctx[4].id);
    			attr_dev(div1, "name", div1_name_value = /*item*/ ctx[4].name);
    			attr_dev(div1, "image", div1_image_value = /*item*/ ctx[4].image);
    			add_location(div1, file$3, 60, 4, 1298);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*deleteItem*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[4].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = /*item*/ ctx[4].name.replace(/ \([\s\S]*?\)/g, '') + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && div1_id_value !== (div1_id_value = /*item*/ ctx[4].id)) {
    				attr_dev(div1, "id", div1_id_value);
    			}

    			if (dirty & /*items*/ 1 && div1_name_value !== (div1_name_value = /*item*/ ctx[4].name)) {
    				attr_dev(div1, "name", div1_name_value);
    			}

    			if (dirty & /*items*/ 1 && div1_image_value !== (div1_image_value = /*item*/ ctx[4].image)) {
    				attr_dev(div1, "image", div1_image_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(60:3) {#each items as item, index}",
    		ctx
    	});

    	return block;
    }

    // (55:15)       <p>...Loading</p>     {:then items }
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "...Loading";
    			add_location(p, file$3, 55, 5, 1196);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(55:15)       <p>...Loading</p>     {:then items }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 0,
    		error: 7
    	};

    	handle_promise(promise = /*items*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			attr_dev(main, "class", "svelte-122rnvj");
    			add_location(main, file$3, 52, 0, 1166);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*items*/ 1 && promise !== (promise = /*items*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let items;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	let { logined = false } = $$props;
    	let { token = '' } = $$props;

    	function deleteItem(event) {
    		if (!logined) {
    			alert('login required to delete');
    			return;
    		}

    		let flag = confirm('Are you sure to delete this item?');
    		if (!flag) return;
    		const id = event.target.parentElement.getAttribute('id');
    		const name = event.target.parentElement.getAttribute('name');
    		const image = event.target.parentElement.getAttribute('image');

    		const payload = {
    			'id': Number(id),
    			name,
    			'recent': 0,
    			image
    		};

    		fetch('http://newsongg.run.goorm.io/item', {
    			method: 'DELETE',
    			headers: {
    				'Content-Type': 'application/json',
    				'Authorization': 'Bearer ' + token
    			},
    			body: JSON.stringify(payload)
    		}).then(resp => {
    			return resp.json();
    		}).then(resp => {
    			alert(resp.name + ' removed successfully');
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	const writable_props = ['logined', 'token'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('logined' in $$props) $$invalidate(2, logined = $$props.logined);
    		if ('token' in $$props) $$invalidate(3, token = $$props.token);
    	};

    	$$self.$capture_state = () => ({ logined, token, deleteItem, items });

    	$$self.$inject_state = $$props => {
    		if ('logined' in $$props) $$invalidate(2, logined = $$props.logined);
    		if ('token' in $$props) $$invalidate(3, token = $$props.token);
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(0, items = fetch('http://newsongg.run.goorm.io/item').then(resp => {
    		return resp.json();
    	}).then(resp => {
    		return resp;
    	}).catch(error => {
    		console.error(error);
    		return [];
    	}));

    	return [items, deleteItem, logined, token];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { logined: 2, token: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get logined() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logined(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get token() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/add.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$2 = "src/add.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (91:4) {:else}
    function create_else_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Login required.";
    			add_location(div, file$2, 91, 8, 2241);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(91:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (76:1) {#if logined}
    function create_if_block$2(ctx) {
    	let form;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div;
    	let mounted;
    	let dispose;
    	let each_value = /*searchResult*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			form = element("form");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "search";
    			t2 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "id", "query");
    			attr_dev(input, "type", "text");
    			add_location(input, file$2, 78, 3, 1857);
    			attr_dev(button, "class", "svelte-be2ae6");
    			add_location(button, file$2, 79, 3, 1892);
    			attr_dev(form, "id", "searchForm");
    			attr_dev(form, "class", "svelte-be2ae6");
    			add_location(form, file$2, 77, 2, 1795);
    			attr_dev(div, "class", "itemView");
    			add_location(div, file$2, 82, 2, 1931);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input);
    			append_dev(form, t0);
    			append_dev(form, button);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*search*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*searchResult, addItem*/ 10) {
    				each_value = /*searchResult*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(76:1) {#if logined}",
    		ctx
    	});

    	return block;
    }

    // (84:3) {#each searchResult as item}
    function create_each_block(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1_value = /*item*/ ctx[7].name + "";
    	let t1;
    	let t2;
    	let div1_id_value;
    	let div1_name_value;
    	let div1_image_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[7].imgList[3].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 85, 5, 2078);
    			attr_dev(div0, "class", "itemName");
    			add_location(div0, file$2, 86, 5, 2146);
    			attr_dev(div1, "class", "item svelte-be2ae6");
    			attr_dev(div1, "id", div1_id_value = /*item*/ ctx[7].id);
    			attr_dev(div1, "name", div1_name_value = /*item*/ ctx[7].name);
    			attr_dev(div1, "image", div1_image_value = /*item*/ ctx[7].imgList[3].url);
    			add_location(div1, file$2, 84, 4, 1990);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*addItem*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*searchResult*/ 2 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[7].imgList[3].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*searchResult*/ 2 && t1_value !== (t1_value = /*item*/ ctx[7].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*searchResult*/ 2 && div1_id_value !== (div1_id_value = /*item*/ ctx[7].id)) {
    				attr_dev(div1, "id", div1_id_value);
    			}

    			if (dirty & /*searchResult*/ 2 && div1_name_value !== (div1_name_value = /*item*/ ctx[7].name)) {
    				attr_dev(div1, "name", div1_name_value);
    			}

    			if (dirty & /*searchResult*/ 2 && div1_image_value !== (div1_image_value = /*item*/ ctx[7].imgList[3].url)) {
    				attr_dev(div1, "image", div1_image_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(84:3) {#each searchResult as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*logined*/ ctx[0]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file$2, 74, 0, 1768);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Add', slots, []);
    	let { logined = false } = $$props;
    	let { username = '' } = $$props;
    	let { token = '' } = $$props;
    	let searchResult = [];

    	function loginProc() {
    		let formData = new FormData(document.getElementById('loginForm'));

    		fetch('http://newsongg.run.goorm.io/login', { method: 'POST', body: formData }).then(resp => {
    			return resp.json();
    		}).then(resp => {
    			if (!resp.access_token) {
    				//login failed
    				alert(resp.detail);

    				return;
    			}

    			$$invalidate(0, logined = true);
    			$$invalidate(5, token = resp.access_token);
    			$$invalidate(4, username = formData.get('username'));
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	function search() {
    		const query = document.getElementById('query').value;

    		fetch('https://www.music-flo.com/api/search/v2/search?keyword=' + query + '&searchType=ARTIST&sortType=ACCURACY&size=10&page=1').then(resp => {
    			return resp.json();
    		}).then(resp => {
    			if (Object.keys(resp.data).length == 0) {
    				alert(resp.message);
    				return;
    			}

    			$$invalidate(1, searchResult = resp.data.list[0].list);
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	function addItem(event) {
    		const id = event.target.parentElement.getAttribute('id');
    		const name = event.target.parentElement.getAttribute('name');
    		const image = event.target.parentElement.getAttribute('image');

    		const payload = {
    			'id': Number(id),
    			name,
    			'recent': 0,
    			image
    		};

    		fetch('http://newsongg.run.goorm.io/item', {
    			method: 'POST',
    			headers: {
    				'Content-Type': 'application/json',
    				'Authorization': 'Bearer ' + token
    			},
    			body: JSON.stringify(payload)
    		}).then(resp => {
    			return resp.json();
    		}).then(resp => {
    			alert(resp.name + ' added successfully');
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	const writable_props = ['logined', 'username', 'token'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Add> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('logined' in $$props) $$invalidate(0, logined = $$props.logined);
    		if ('username' in $$props) $$invalidate(4, username = $$props.username);
    		if ('token' in $$props) $$invalidate(5, token = $$props.token);
    	};

    	$$self.$capture_state = () => ({
    		logined,
    		username,
    		token,
    		searchResult,
    		loginProc,
    		search,
    		addItem
    	});

    	$$self.$inject_state = $$props => {
    		if ('logined' in $$props) $$invalidate(0, logined = $$props.logined);
    		if ('username' in $$props) $$invalidate(4, username = $$props.username);
    		if ('token' in $$props) $$invalidate(5, token = $$props.token);
    		if ('searchResult' in $$props) $$invalidate(1, searchResult = $$props.searchResult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [logined, searchResult, search, addItem, username, token];
    }

    class Add extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { logined: 0, username: 4, token: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Add",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get logined() {
    		throw new Error("<Add>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logined(value) {
    		throw new Error("<Add>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get username() {
    		throw new Error("<Add>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<Add>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get token() {
    		throw new Error("<Add>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<Add>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/login.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file$1 = "src/login.svelte";

    // (61:4) {:else}
    function create_else_block$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "logout";
    			attr_dev(button, "id", "logoutBtn");
    			attr_dev(button, "class", "svelte-1d7n9dx");
    			add_location(button, file$1, 61, 8, 1369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(61:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:1) {#if !logined}
    function create_if_block$1(ctx) {
    	let form;
    	let t0;
    	let input0;
    	let t1;
    	let br0;
    	let t2;
    	let input1;
    	let t3;
    	let br1;
    	let t4;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			t0 = text("ID\n            ");
    			input0 = element("input");
    			t1 = space();
    			br0 = element("br");
    			t2 = text("\n            PW\n            ");
    			input1 = element("input");
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			button = element("button");
    			button.textContent = "login";
    			attr_dev(input0, "id", "id");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "username");
    			add_location(input0, file$1, 53, 12, 1127);
    			add_location(br0, file$1, 54, 12, 1184);
    			attr_dev(input1, "id", "pw");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			add_location(input1, file$1, 56, 12, 1217);
    			add_location(br1, file$1, 57, 12, 1278);
    			attr_dev(button, "id", "loginBtn");
    			attr_dev(button, "class", "svelte-1d7n9dx");
    			add_location(button, file$1, 58, 12, 1296);
    			attr_dev(form, "id", "loginForm");
    			attr_dev(form, "class", "svelte-1d7n9dx");
    			add_location(form, file$1, 51, 8, 1039);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, t0);
    			append_dev(form, input0);
    			append_dev(form, t1);
    			append_dev(form, br0);
    			append_dev(form, t2);
    			append_dev(form, input1);
    			append_dev(form, t3);
    			append_dev(form, br1);
    			append_dev(form, t4);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*loginProc*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(50:1) {#if !logined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (!/*logined*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file$1, 47, 0, 1004);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const dispatch = createEventDispatcher();
    	let { logined = false } = $$props;
    	let username = '';
    	let token = '';

    	function loginProc() {
    		let formData = new FormData(document.getElementById('loginForm'));

    		if (formData.get('username') == '' || formData.get('password') == '') {
    			alert('Username, password both required');
    			return;
    		}

    		fetch('http://newsongg.run.goorm.io/login', { method: 'POST', body: formData }).then(resp => {
    			return resp.json();
    		}).then(resp => {
    			if (!resp.access_token) {
    				//login failed
    				alert(resp.detail);

    				return;
    			}

    			$$invalidate(0, logined = true);
    			$$invalidate(3, token = resp.access_token);
    			$$invalidate(2, username = formData.get('username'));
    		}).catch(error => {
    			console.error(error);
    		});
    	}

    	function logout() {
    		$$invalidate(0, logined = false);
    		$$invalidate(3, token = '');
    		$$invalidate(2, username = '');
    	}

    	const writable_props = ['logined'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('logined' in $$props) $$invalidate(0, logined = $$props.logined);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		logined,
    		username,
    		token,
    		loginProc,
    		logout
    	});

    	$$self.$inject_state = $$props => {
    		if ('logined' in $$props) $$invalidate(0, logined = $$props.logined);
    		if ('username' in $$props) $$invalidate(2, username = $$props.username);
    		if ('token' in $$props) $$invalidate(3, token = $$props.token);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*logined, username, token*/ 13) {
    			(() => {
    				dispatch('loginProps', { logined, username, token });
    			})();
    		}
    	};

    	return [logined, loginProc, username, token];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { logined: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get logined() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logined(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/main.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file = "src/main.svelte";

    // (31:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("welcome!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(31:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:1) {#if logined}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(/*username*/ ctx[1]);
    			t1 = text(" logined!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 2) set_data_dev(t0, /*username*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(29:1) {#if logined}",
    		ctx
    	});

    	return block;
    }

    // (48:42) 
    function create_if_block_2(ctx) {
    	let loginapp;
    	let current;

    	loginapp = new Login({
    			props: { logined: /*logined*/ ctx[2] },
    			$$inline: true
    		});

    	loginapp.$on("loginProps", /*loginProps*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(loginapp.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loginapp, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loginapp_changes = {};
    			if (dirty & /*logined*/ 4) loginapp_changes.logined = /*logined*/ ctx[2];
    			loginapp.$set(loginapp_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loginapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loginapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loginapp, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(48:42) ",
    		ctx
    	});

    	return block;
    }

    // (46:40) 
    function create_if_block_1(ctx) {
    	let addapp;
    	let current;

    	addapp = new Add({
    			props: {
    				logined: /*logined*/ ctx[2],
    				username: /*username*/ ctx[1],
    				token: /*token*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(addapp.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addapp, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addapp_changes = {};
    			if (dirty & /*logined*/ 4) addapp_changes.logined = /*logined*/ ctx[2];
    			if (dirty & /*username*/ 2) addapp_changes.username = /*username*/ ctx[1];
    			if (dirty & /*token*/ 1) addapp_changes.token = /*token*/ ctx[0];
    			addapp.$set(addapp_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addapp, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(46:40) ",
    		ctx
    	});

    	return block;
    }

    // (44:8) {#if current == status.LIST}
    function create_if_block(ctx) {
    	let listapp;
    	let current;

    	listapp = new List({
    			props: {
    				logined: /*logined*/ ctx[2],
    				token: /*token*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(listapp.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listapp, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listapp_changes = {};
    			if (dirty & /*logined*/ 4) listapp_changes.logined = /*logined*/ ctx[2];
    			if (dirty & /*token*/ 1) listapp_changes.token = /*token*/ ctx[0];
    			listapp.$set(listapp_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listapp, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:8) {#if current == status.LIST}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div1;
    	let button0;
    	let t2;
    	let span0;
    	let t4;
    	let button1;
    	let t6;
    	let span1;
    	let t8;
    	let button2;
    	let t10;
    	let div2;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*logined*/ ctx[2]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*current*/ ctx[3] == /*status*/ ctx[4].LIST) return 0;
    		if (/*current*/ ctx[3] == /*status*/ ctx[4].ADD) return 1;
    		if (/*current*/ ctx[3] == /*status*/ ctx[4].LOGIN) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "main";
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "|";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "add";
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "|";
    			t8 = space();
    			button2 = element("button");
    			button2.textContent = "login";
    			t10 = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "id", "greeting");
    			attr_dev(div0, "class", "svelte-buhpt5");
    			add_location(div0, file, 27, 4, 489);
    			attr_dev(button0, "class", "menuBtn svelte-buhpt5");
    			add_location(button0, file, 35, 8, 622);
    			attr_dev(span0, "class", "svelte-buhpt5");
    			add_location(span0, file, 36, 8, 709);
    			attr_dev(button1, "class", "menuBtn svelte-buhpt5");
    			add_location(button1, file, 37, 8, 732);
    			attr_dev(span1, "class", "svelte-buhpt5");
    			add_location(span1, file, 38, 8, 817);
    			attr_dev(button2, "class", "menuBtn svelte-buhpt5");
    			add_location(button2, file, 39, 8, 840);
    			attr_dev(div1, "id", "nav");
    			attr_dev(div1, "class", "svelte-buhpt5");
    			add_location(div1, file, 34, 4, 599);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-buhpt5");
    			add_location(div2, file, 42, 4, 938);
    			attr_dev(main, "class", "svelte-buhpt5");
    			add_location(main, file, 26, 0, 478);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			if_block0.m(div0, null);
    			append_dev(main, t0);
    			append_dev(main, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t2);
    			append_dev(div1, span0);
    			append_dev(div1, t4);
    			append_dev(div1, button1);
    			append_dev(div1, t6);
    			append_dev(div1, span1);
    			append_dev(div1, t8);
    			append_dev(div1, button2);
    			append_dev(main, t10);
    			append_dev(main, div2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div2, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div2, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let current;
    	let logined;
    	let username;
    	let token;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	const status = { 'LIST': 0, 'ADD': 1, 'LOGIN': 2 };
    	Object.freeze(status);

    	function setStatus(status) {
    		$$invalidate(3, current = status);
    	}

    	const loginProps = e => {
    		$$invalidate(2, logined = e.detail.logined);
    		$$invalidate(1, username = e.detail.username);
    		$$invalidate(0, token = e.detail.token);
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setStatus(status.LIST);
    	const click_handler_1 = () => setStatus(status.ADD);
    	const click_handler_2 = () => setStatus(status.LOGIN);

    	$$self.$capture_state = () => ({
    		ListApp: List,
    		AddApp: Add,
    		LoginApp: Login,
    		status,
    		setStatus,
    		loginProps,
    		token,
    		username,
    		logined,
    		current
    	});

    	$$self.$inject_state = $$props => {
    		if ('token' in $$props) $$invalidate(0, token = $$props.token);
    		if ('username' in $$props) $$invalidate(1, username = $$props.username);
    		if ('logined' in $$props) $$invalidate(2, logined = $$props.logined);
    		if ('current' in $$props) $$invalidate(3, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(3, current = status.LIST);
    	$$invalidate(2, logined = false);
    	$$invalidate(1, username = '');
    	$$invalidate(0, token = '');

    	return [
    		token,
    		username,
    		logined,
    		current,
    		status,
    		setStatus,
    		loginProps,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const main = new Main({
    	target: document.getElementById('MainApp'),
    	props: {}
    });

    exports.main = main;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=bundle.js.map
