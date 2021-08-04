
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
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

    /* src/components/Header.svelte generated by Svelte v3.38.3 */

    const file$6 = "src/components/Header.svelte";

    function create_fragment$7(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let h1;
    	let t3;
    	let span;
    	let a0;
    	let svg0;
    	let path0;
    	let t4;
    	let a1;
    	let svg1;
    	let rect;
    	let path1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Hillcroft Lacrosse Club";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Welcome to the Hillcroft Lacrosse club store.";
    			t3 = space();
    			span = element("span");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t4 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			rect = svg_element("rect");
    			path1 = svg_element("path");
    			attr_dev(h2, "class", "lg:mb-8 mb-4 text-xs font-semibold tracking-widest text-black uppercase title-font");
    			add_location(h2, file$6, 4, 8, 208);
    			attr_dev(h1, "class", "mx-auto lg:mb-8 mb-1 text-center text-2xl font-semibold leading-none tracking-tighter text-black lg:w-3/4 sm:text-6xl title-font");
    			add_location(h1, file$6, 5, 8, 340);
    			attr_dev(path0, "d", "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z");
    			add_location(path0, file$6, 9, 16, 875);
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "class", "w-10 h-10");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file$6, 8, 12, 731);
    			attr_dev(a0, "class", "text-yellow hover:text-black");
    			attr_dev(a0, "href", "https://www.facebook.com/hillcroftlacrosse/");
    			add_location(a0, file$6, 7, 12, 627);
    			attr_dev(rect, "width", "20");
    			attr_dev(rect, "height", "20");
    			attr_dev(rect, "x", "2");
    			attr_dev(rect, "y", "2");
    			attr_dev(rect, "rx", "5");
    			attr_dev(rect, "ry", "5");
    			add_location(rect, file$6, 14, 16, 1271);
    			attr_dev(path1, "d", "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01");
    			add_location(path1, file$6, 15, 16, 1350);
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "class", "w-10 h-10");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file$6, 13, 12, 1113);
    			attr_dev(a1, "class", "ml-3 text-yellow hover:text-black");
    			attr_dev(a1, "href", "https://www.instagram.com/hillcroftlacrosse");
    			add_location(a1, file$6, 12, 12, 1004);
    			attr_dev(span, "class", "inline-flex justify-center mx-auto md:mt-4 sm:mt-0 w-full");
    			add_location(span, file$6, 6, 8, 542);
    			attr_dev(div0, "class", "flex flex-col w-full mb-2 lg:mb-8 text-left lg:text-center");
    			add_location(div0, file$6, 3, 8, 127);
    			attr_dev(div1, "class", "container flex flex-col items-center px-5 py-2 lg:py-8 mx-auto");
    			add_location(div1, file$6, 2, 4, 42);
    			attr_dev(section, "class", "text-blueGray-700 ");
    			add_location(section, file$6, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, span);
    			append_dev(span, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(span, t4);
    			append_dev(span, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, rect);
    			append_dev(svg1, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.38.3 */

    const file$5 = "src/components/Footer.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let a;
    	let t2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("Created by ");
    			a = element("a");
    			a.textContent = "Thomas Ridings";
    			t2 = text(" © 2021");
    			attr_dev(a, "href", "https://thomasridings.com");
    			add_location(a, file$5, 3, 87, 271);
    			attr_dev(p, "class", "mx-auto text-sm text-center text-black sm:text-left ");
    			add_location(p, file$5, 3, 12, 196);
    			attr_dev(div0, "class", "flex flex-col w-full mb-12 text-left lg:text-center");
    			add_location(div0, file$5, 2, 8, 118);
    			attr_dev(div1, "class", "container flex flex-col items-center px-5 py-8 mx-auto");
    			add_location(div1, file$5, 1, 4, 41);
    			attr_dev(section, "class", "text-blueGray-700 ");
    			add_location(section, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, a);
    			append_dev(p, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const isEmailOpen = writable(false);
    const isSuccessOpen = writable(false);

    const isErrorOpen = writable(false);
    const errorMessage = writable("");

    const price_id = writable("");
    const frequency = writable("");


    /*
    Helper functions for the customer details modal
    */
    function showEmail(price, freq){
        isEmailOpen.set(true);
        price_id.set(price);
        frequency.set(freq);
    }

    function hideEmail(){
        isEmailOpen.set(false);
        price_id.set("");
        frequency.set("");
    }


    /*
    Helper functions to display the error screen
    */
    function showError(errMsg="We've had a problem somewhere."){
        price_id.set("");
        frequency.set("");

        isEmailOpen.set(false);
        isSuccessOpen.set(false);

        errorMessage.set(errMsg);
        isErrorOpen.set(true);
    }

    function hideError(){
        isErrorOpen.set(false);
        errorMessage.set("");
        window.location.href = '/';
    }

    /*
    Helper functions for the success modal
    */

    function showSuccess(){
        hideEmail();
        isSuccessOpen.set(true);
    }

    function hideSuccess(){
        isSuccessOpen.set(false);
        window.location.href = '/';
    }

    /* src/components/productGrid/ProductTile.svelte generated by Svelte v3.38.3 */
    const file$4 = "src/components/productGrid/ProductTile.svelte";

    // (28:215) 
    function create_if_block_2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "/quarter";
    			attr_dev(span, "class", "text-lg font-semibold");
    			add_location(span, file$4, 27, 215, 1177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(28:215) ",
    		ctx
    	});

    	return block;
    }

    // (28:106) {#if frequency==='month|1'}
    function create_if_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "/month";
    			attr_dev(span, "class", "text-lg font-semibold");
    			add_location(span, file$4, 27, 133, 1095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(28:106) {#if frequency==='month|1'}",
    		ctx
    	});

    	return block;
    }

    // (30:79) {#if description}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*description*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*description*/ 2) set_data_dev(t, /*description*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:79) {#if description}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t2;
    	let p0;
    	let t3;
    	let t4_value = /*price*/ ctx[5] / 100 + "";
    	let t4;
    	let t5;
    	let h4;
    	let t6;
    	let t7;
    	let p1;
    	let t8;
    	let t9;
    	let button;
    	let svg;
    	let path;
    	let t10;
    	let span;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*frequency*/ ctx[4] === "month|1") return create_if_block_1;
    		if (/*frequency*/ ctx[4] === "month|3") return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*description*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "HILLCROFT";
    			t2 = space();
    			p0 = element("p");
    			t3 = text("£");
    			t4 = text(t4_value);
    			if (if_block0) if_block0.c();
    			t5 = space();
    			h4 = element("h4");
    			t6 = text(/*name*/ ctx[0]);
    			t7 = space();
    			p1 = element("p");
    			t8 = text(" ");
    			if (if_block1) if_block1.c();
    			t9 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t10 = space();
    			span = element("span");
    			span.textContent = "Buy Now";
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "flex-shrink-0 object-cover object-center w-16 h-16 mx-auto -mt-12 rounded-full shadow-xl aboslute border-black border-2");
    			if (img.src !== (img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 25, 14, 668);
    			attr_dev(h2, "class", "pt-4text-xs font-semibold tracking-widest text-black uppercase title-font hidden md:visible");
    			add_location(h2, file$4, 26, 14, 843);
    			attr_dev(p0, "class", "mb-2 text-4xl font-semibold leading-none text-yellow title-font pt-2");
    			add_location(p0, file$4, 27, 14, 976);
    			attr_dev(h4, "class", "mb-2 text-2xl font-semibold leading-none text-black lg:text-3xl title-font ");
    			add_location(h4, file$4, 28, 14, 1253);
    			attr_dev(p1, "class", "mb-3 text-base leading-relaxed text-blueGray-500");
    			add_location(p1, file$4, 29, 14, 1367);
    			attr_dev(path, "d", "M14.781,14.347h1.738c0.24,0,0.436-0.194,0.436-0.435v-1.739c0-0.239-0.195-0.435-0.436-0.435h-1.738c-0.239,0-0.435,0.195-0.435,0.435v1.739C14.347,14.152,14.542,14.347,14.781,14.347 M18.693,3.045H1.307c-0.48,0-0.869,0.39-0.869,0.869v12.17c0,0.479,0.389,0.869,0.869,0.869h17.387c0.479,0,0.869-0.39,0.869-0.869V3.915C19.562,3.435,19.173,3.045,18.693,3.045 M18.693,16.085H1.307V9.13h17.387V16.085z M18.693,5.653H1.307V3.915h17.387V5.653zM3.48,12.608h7.824c0.24,0,0.435-0.195,0.435-0.436c0-0.239-0.194-0.435-0.435-0.435H3.48c-0.24,0-0.435,0.195-0.435,0.435C3.045,12.413,3.24,12.608,3.48,12.608 M3.48,14.347h6.085c0.24,0,0.435-0.194,0.435-0.435s-0.195-0.435-0.435-0.435H3.48c-0.24,0-0.435,0.194-0.435,0.435S3.24,14.347,3.48,14.347");
    			add_location(path, file$4, 31, 110, 1730);
    			attr_dev(svg, "class", "fill-current w-4 h-4 mr-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			add_location(svg, file$4, 31, 16, 1636);
    			attr_dev(span, "class", "");
    			add_location(span, file$4, 32, 16, 2487);
    			attr_dev(button, "class", "bg-yellow text-white border-0 py-2 px-4 rounded inline-flex items-center");
    			add_location(button, file$4, 30, 14, 1488);
    			attr_dev(div0, "class", "p-6 text-center");
    			add_location(div0, file$4, 24, 12, 624);
    			attr_dev(div1, "class", "w-full mx-auto my-4 bg-white border rounded-lg shadow-xl lg:w-full border-black");
    			add_location(div1, file$4, 23, 10, 518);
    			attr_dev(div2, "class", "flex flex-wrap w-full flex-1");
    			add_location(div2, file$4, 22, 8, 465);
    			attr_dev(div3, "class", "container items-center px-5 py-2 lg:px-10");
    			add_location(div3, file$4, 21, 4, 401);
    			add_location(section, file$4, 17, 0, 378);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			if (if_block0) if_block0.m(p0, null);
    			append_dev(div0, t5);
    			append_dev(div0, h4);
    			append_dev(h4, t6);
    			append_dev(div0, t7);
    			append_dev(div0, p1);
    			append_dev(p1, t8);
    			if (if_block1) if_block1.m(p1, null);
    			append_dev(div0, t9);
    			append_dev(div0, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t10);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(showEmail(/*price_id*/ ctx[3], /*frequency*/ ctx[4]))) showEmail(/*price_id*/ ctx[3], /*frequency*/ ctx[4]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (dirty & /*image*/ 4 && img.src !== (img_src_value = /*image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*price*/ 32 && t4_value !== (t4_value = /*price*/ ctx[5] / 100 + "")) set_data_dev(t4, t4_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(p0, null);
    				}
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t6, /*name*/ ctx[0]);

    			if (/*description*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(p1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductTile", slots, []);
    	let { id } = $$props;
    	let { name } = $$props;
    	let { metadata } = $$props;
    	let { description = " " } = $$props;
    	let { image = "/images/hillcroft_lacrosse_club_logo.png" } = $$props;
    	let { price_id } = $$props;
    	let { price_metadata = {} } = $$props;
    	let { price_nickname } = $$props;
    	let { frequency } = $$props;
    	let { price } = $$props;

    	const writable_props = [
    		"id",
    		"name",
    		"metadata",
    		"description",
    		"image",
    		"price_id",
    		"price_metadata",
    		"price_nickname",
    		"frequency",
    		"price"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProductTile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("metadata" in $$props) $$invalidate(7, metadata = $$props.metadata);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("image" in $$props) $$invalidate(2, image = $$props.image);
    		if ("price_id" in $$props) $$invalidate(3, price_id = $$props.price_id);
    		if ("price_metadata" in $$props) $$invalidate(8, price_metadata = $$props.price_metadata);
    		if ("price_nickname" in $$props) $$invalidate(9, price_nickname = $$props.price_nickname);
    		if ("frequency" in $$props) $$invalidate(4, frequency = $$props.frequency);
    		if ("price" in $$props) $$invalidate(5, price = $$props.price);
    	};

    	$$self.$capture_state = () => ({
    		id,
    		name,
    		metadata,
    		description,
    		image,
    		price_id,
    		price_metadata,
    		price_nickname,
    		frequency,
    		price,
    		showEmail
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("metadata" in $$props) $$invalidate(7, metadata = $$props.metadata);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("image" in $$props) $$invalidate(2, image = $$props.image);
    		if ("price_id" in $$props) $$invalidate(3, price_id = $$props.price_id);
    		if ("price_metadata" in $$props) $$invalidate(8, price_metadata = $$props.price_metadata);
    		if ("price_nickname" in $$props) $$invalidate(9, price_nickname = $$props.price_nickname);
    		if ("frequency" in $$props) $$invalidate(4, frequency = $$props.frequency);
    		if ("price" in $$props) $$invalidate(5, price = $$props.price);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		description,
    		image,
    		price_id,
    		frequency,
    		price,
    		id,
    		metadata,
    		price_metadata,
    		price_nickname
    	];
    }

    class ProductTile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			id: 6,
    			name: 0,
    			metadata: 7,
    			description: 1,
    			image: 2,
    			price_id: 3,
    			price_metadata: 8,
    			price_nickname: 9,
    			frequency: 4,
    			price: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductTile",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[6] === undefined && !("id" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'id'");
    		}

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'name'");
    		}

    		if (/*metadata*/ ctx[7] === undefined && !("metadata" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'metadata'");
    		}

    		if (/*price_id*/ ctx[3] === undefined && !("price_id" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'price_id'");
    		}

    		if (/*price_nickname*/ ctx[9] === undefined && !("price_nickname" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'price_nickname'");
    		}

    		if (/*frequency*/ ctx[4] === undefined && !("frequency" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'frequency'");
    		}

    		if (/*price*/ ctx[5] === undefined && !("price" in props)) {
    			console.warn("<ProductTile> was created without expected prop 'price'");
    		}
    	}

    	get id() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get metadata() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set metadata(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price_id() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price_id(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price_metadata() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price_metadata(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price_nickname() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price_nickname(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frequency() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frequency(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<ProductTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<ProductTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const Name = writable(false);
    const Email = writable(false);

    function setName(value){
        return new Promise((resolve, reject) => {
            if(value == undefined || value == null || value == '' || !value.includes(" ")){
                reject(Error('Please enter your full name'));
            } else {
                Name.set(value);
                resolve(value);
            }
        })
    }

    function setEmail(value){
        return new Promise((resolve, reject) => {
            if(value == undefined || value == null || value == '' || !!!value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
                reject(Error('Please enter a valid email address.'));
            } else {
                Email.set(value);
                resolve(value);
            }
        })
        
    }


    function setPhone(value){
        return new Promise((resolve, reject) => {
            if(value == undefined || value == null || value == '' || !!!value.match(/^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?(?:\(?0\)?[\s-]?)?)|(?:\(?0))(?:(?:\d{5}\)?[\s-]?\d{4,5})|(?:\d{4}\)?[\s-]?(?:\d{5}|\d{3}[\s-]?\d{3}))|(?:\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4})|(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}))(?:[\s-]?(?:x|ext\.?|\#)\d{3,4})?$/)){
                reject(Error('Please enter a valid mobile number.'));
            } else {
                Email.set(value);
                resolve(value);
            }
        })
        
    }

    /* src/components/productGrid/emailModal.svelte generated by Svelte v3.38.3 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/components/productGrid/emailModal.svelte";

    function create_fragment$4(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let div7;
    	let div6;
    	let h1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let div2;
    	let div1;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let label2;
    	let t11;
    	let input2;
    	let t12;
    	let span0;
    	let t13;
    	let t14;
    	let button0;
    	let span1;
    	let t15;
    	let svg0;
    	let path0;
    	let t16;
    	let svg1;
    	let circle;
    	let path1;
    	let t17;
    	let div5;
    	let div4;
    	let div3;
    	let button1;
    	let svg2;
    	let path2;
    	let t18;
    	let span2;
    	let div8_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "HILLCROFT LACROSSE CLUB STORE";
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Full Name";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Email";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Mobile Number";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			span0 = element("span");
    			t13 = text(/*errorMessage*/ ctx[6]);
    			t14 = space();
    			button0 = element("button");
    			span1 = element("span");
    			t15 = text("Payment\n              ");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t16 = space();
    			svg1 = svg_element("svg");
    			circle = svg_element("circle");
    			path1 = svg_element("path");
    			t17 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t18 = space();
    			span2 = element("span");
    			span2.textContent = "Back to store";
    			attr_dev(div0, "class", "fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-700 opacity-75 z-10");
    			add_location(div0, file$3, 81, 2, 2266);
    			attr_dev(h1, "class", "text-lg text-center font-bold");
    			add_location(h1, file$3, 85, 6, 2546);
    			if (img.src !== (img_src_value = "/images/hillcroft_lacrosse_club_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Hillcroft Lacrosse Club Logo");
    			attr_dev(img, "class", "object-none object-center w-auto mx-auto py-5");
    			add_location(img, file$3, 86, 6, 2629);
    			attr_dev(label0, "class", "font-semibold text-sm text-gray-600 pb-1 block");
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$3, 90, 10, 2902);
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full");
    			add_location(input0, file$3, 91, 10, 3003);
    			attr_dev(label1, "class", "font-semibold text-sm text-gray-600 pb-1 block");
    			attr_dev(label1, "for", "email");
    			add_location(label1, file$3, 92, 10, 3124);
    			attr_dev(input1, "id", "email");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full");
    			add_location(input1, file$3, 93, 10, 3222);
    			attr_dev(label2, "class", "font-semibold text-sm text-gray-600 pb-1 block");
    			attr_dev(label2, "for", "phone");
    			add_location(label2, file$3, 94, 10, 3344);
    			attr_dev(input2, "id", "phone");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full");
    			add_location(input2, file$3, 95, 10, 3450);
    			attr_dev(span0, "class", "flex items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1 m-2");
    			toggle_class(span0, "hidden", /*isValid*/ ctx[4]);
    			add_location(span0, file$3, 96, 10, 3572);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M17 8l4 4m0 0l-4 4m4-4H3");
    			add_location(path0, file$3, 102, 16, 4273);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-4 h-4 inline-block");
    			toggle_class(svg0, "hidden", /*isLoading*/ ctx[5]);
    			add_location(svg0, file$3, 101, 14, 4105);
    			attr_dev(circle, "class", "opacity-25");
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "12");
    			attr_dev(circle, "r", "10");
    			attr_dev(circle, "stroke", "currentColor");
    			attr_dev(circle, "stroke-width", "4");
    			add_location(circle, file$3, 106, 16, 4542);
    			attr_dev(path1, "class", "opacity-75");
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
    			add_location(path1, file$3, 107, 16, 4657);
    			attr_dev(svg1, "class", "animate-spin h-5 w-5 mr-3 inline-block");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			toggle_class(svg1, "hidden", !/*isLoading*/ ctx[5]);
    			add_location(svg1, file$3, 105, 14, 4425);
    			attr_dev(span1, "class", "inline-block mr-2");
    			add_location(span1, file$3, 100, 12, 4051);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block");
    			add_location(button0, file$3, 99, 10, 3734);
    			attr_dev(div1, "class", "px-5 py-7");
    			add_location(div1, file$3, 89, 8, 2868);
    			attr_dev(div2, "class", "bg-white shadow w-full rounded-lg divide-y divide-gray-200");
    			add_location(div2, file$3, 87, 6, 2778);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M10 19l-7-7m0 0l7-7m-7 7h18");
    			add_location(path2, file$3, 124, 16, 5579);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "class", "w-4 h-4 inline-block align-text-top");
    			add_location(svg2, file$3, 117, 14, 5329);
    			attr_dev(span2, "class", "inline-block ml-1");
    			add_location(span2, file$3, 131, 14, 5807);
    			attr_dev(button1, "class", "transition duration-200 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset");
    			add_location(button1, file$3, 116, 12, 5062);
    			attr_dev(div3, "class", "text-center sm:text-left whitespace-nowrap");
    			add_location(div3, file$3, 115, 10, 4993);
    			attr_dev(div4, "class", "grid grid-cols-2 gap-1");
    			add_location(div4, file$3, 114, 8, 4946);
    			attr_dev(div5, "class", "py-5");
    			add_location(div5, file$3, 113, 6, 4919);
    			attr_dev(div6, "class", "px-10 py-10 mx-auto md:w-full md:max-w-md");
    			add_location(div6, file$3, 84, 4, 2484);
    			attr_dev(div7, "class", "bg-gray-100 flex opacity-100 flex-col justify-center sm:p-8 mx-4 my-8 rounded-lg z-20 max-h-full");
    			add_location(div7, file$3, 83, 2, 2369);
    			attr_dev(div8, "wire:loading", "");
    			attr_dev(div8, "class", div8_class_value = "" + ((/*emailOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center p-4"));
    			add_location(div8, file$3, 79, 0, 2094);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div8, t0);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t2);
    			append_dev(div6, img);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input0);
    			set_input_value(input0, /*name*/ ctx[1]);
    			append_dev(div1, t6);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, /*email*/ ctx[2]);
    			append_dev(div1, t9);
    			append_dev(div1, label2);
    			append_dev(div1, t11);
    			append_dev(div1, input2);
    			set_input_value(input2, /*phone*/ ctx[3]);
    			append_dev(div1, t12);
    			append_dev(div1, span0);
    			append_dev(span0, t13);
    			append_dev(div1, t14);
    			append_dev(div1, button0);
    			append_dev(button0, span1);
    			append_dev(span1, t15);
    			append_dev(span1, svg0);
    			append_dev(svg0, path0);
    			append_dev(span1, t16);
    			append_dev(span1, svg1);
    			append_dev(svg1, circle);
    			append_dev(svg1, path1);
    			append_dev(div6, t17);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t18);
    			append_dev(button1, span2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(button0, "click", /*submitForm*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", hideEmail, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2 && input0.value !== /*name*/ ctx[1]) {
    				set_input_value(input0, /*name*/ ctx[1]);
    			}

    			if (dirty & /*email*/ 4 && input1.value !== /*email*/ ctx[2]) {
    				set_input_value(input1, /*email*/ ctx[2]);
    			}

    			if (dirty & /*phone*/ 8 && input2.value !== /*phone*/ ctx[3]) {
    				set_input_value(input2, /*phone*/ ctx[3]);
    			}

    			if (dirty & /*errorMessage*/ 64) set_data_dev(t13, /*errorMessage*/ ctx[6]);

    			if (dirty & /*isValid*/ 16) {
    				toggle_class(span0, "hidden", /*isValid*/ ctx[4]);
    			}

    			if (dirty & /*isLoading*/ 32) {
    				toggle_class(svg0, "hidden", /*isLoading*/ ctx[5]);
    			}

    			if (dirty & /*isLoading*/ 32) {
    				toggle_class(svg1, "hidden", !/*isLoading*/ ctx[5]);
    			}

    			if (dirty & /*emailOpen*/ 1 && div8_class_value !== (div8_class_value = "" + ((/*emailOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center p-4"))) {
    				attr_dev(div8, "class", div8_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EmailModal", slots, []);
    	let emailOpen, price, freq;

    	price_id.subscribe(val => {
    		price = val;
    	});

    	frequency.subscribe(val => {
    		freq = val;
    	});

    	isEmailOpen.subscribe(value => {
    		$$invalidate(0, emailOpen = value);
    	});

    	let name, email, phone, isValid = true, isLoading = false, errorMessage = "";

    	function updateCustomerData(name, email, phone) {
    		let promises = [setName(name), setEmail(email), setPhone(phone)];
    		return Promise.all(promises);
    	}

    	async function generateStripeSession() {
    		// add loading display for user
    		return new Promise((resolve, reject) => {
    				fetch("/api/createCheckout", {
    					method: "POST",
    					headers: {
    						"Accept": "application/json",
    						"Content-Type": "application/json"
    					},
    					body: JSON.stringify({
    						product: price,
    						frequency: freq,
    						firstname: name.split(" ")[0],
    						lastname: name.split(" ")[name.split(" ").length - 1],
    						email,
    						phone
    					})
    				}).then(data => {
    					if (data.status !== 200) {
    						// I think this error should bubble up and get caught by the catch statement...should be tested
    						reject("Error creating stripe session. Please try again");
    					} else {
    						resolve(data.json());
    					}
    				}).catch(error => {
    					// surface an error message to the user
    					reject(error.message);
    				});
    			});
    	}

    	function submitForm() {
    		updateCustomerData(name, email, phone).then(() => {
    			$$invalidate(5, isLoading = true);
    		}).then(() => {
    			$$invalidate(4, isValid = true);
    			$$invalidate(6, errorMessage = "");
    		}).then(() => {
    			return generateStripeSession();
    		}).then(resp => {
    			console.log(resp);
    			window.location.replace(resp.sessionUrl);
    		}).catch(err => {
    			console.error(err);
    			$$invalidate(4, isValid = false);
    			$$invalidate(6, errorMessage = err.message);
    		}).finally(() => {
    			$$invalidate(5, isLoading = false);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<EmailModal> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	function input1_input_handler() {
    		email = this.value;
    		$$invalidate(2, email);
    	}

    	function input2_input_handler() {
    		phone = this.value;
    		$$invalidate(3, phone);
    	}

    	$$self.$capture_state = () => ({
    		isEmailOpen,
    		hideEmail,
    		price_id,
    		frequency,
    		showError,
    		setName,
    		setEmail,
    		setPhone,
    		emailOpen,
    		price,
    		freq,
    		name,
    		email,
    		phone,
    		isValid,
    		isLoading,
    		errorMessage,
    		updateCustomerData,
    		generateStripeSession,
    		submitForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("emailOpen" in $$props) $$invalidate(0, emailOpen = $$props.emailOpen);
    		if ("price" in $$props) price = $$props.price;
    		if ("freq" in $$props) freq = $$props.freq;
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("email" in $$props) $$invalidate(2, email = $$props.email);
    		if ("phone" in $$props) $$invalidate(3, phone = $$props.phone);
    		if ("isValid" in $$props) $$invalidate(4, isValid = $$props.isValid);
    		if ("isLoading" in $$props) $$invalidate(5, isLoading = $$props.isLoading);
    		if ("errorMessage" in $$props) $$invalidate(6, errorMessage = $$props.errorMessage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		emailOpen,
    		name,
    		email,
    		phone,
    		isValid,
    		isLoading,
    		errorMessage,
    		submitForm,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class EmailModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmailModal",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/productGrid/errorModal.svelte generated by Svelte v3.38.3 */
    const file$2 = "src/components/productGrid/errorModal.svelte";

    function create_fragment$3(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let div7;
    	let div6;
    	let h1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let div2;
    	let div1;
    	let h3;
    	let t5;
    	let p0;
    	let t6;
    	let t7;
    	let hr;
    	let t8;
    	let p1;
    	let t10;
    	let div5;
    	let div4;
    	let div3;
    	let button;
    	let svg;
    	let path;
    	let t11;
    	let span;
    	let div8_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "HILLCROFT LACROSSE CLUB STORE";
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Oops, this is emabarassing";
    			t5 = space();
    			p0 = element("p");
    			t6 = text(/*errMsg*/ ctx[1]);
    			t7 = space();
    			hr = element("hr");
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Please retry and if the problem persists contact us at info@hillcroftlacrosse.com";
    			t10 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t11 = space();
    			span = element("span");
    			span.textContent = "Back to store";
    			attr_dev(div0, "class", "fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-700 opacity-50 z-10");
    			add_location(div0, file$2, 16, 4, 613);
    			attr_dev(h1, "class", "text-lg text-center font-bold");
    			add_location(h1, file$2, 20, 8, 887);
    			if (img.src !== (img_src_value = "/images/hillcroft_lacrosse_club_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Hillcroft Lacrosse Club Logo");
    			attr_dev(img, "class", "object-none object-center w-auto mx-auto py-5");
    			add_location(img, file$2, 21, 8, 972);
    			attr_dev(h3, "class", "text-center text-2xl text-red-800");
    			add_location(h3, file$2, 24, 12, 1242);
    			attr_dev(p0, "class", "text-center text-lg text-gray-light");
    			add_location(p0, file$2, 25, 12, 1332);
    			attr_dev(hr, "class", "m-5");
    			add_location(hr, file$2, 26, 12, 1404);
    			attr_dev(p1, "class", "text-center");
    			add_location(p1, file$2, 27, 12, 1434);
    			attr_dev(div1, "class", "px-5 py-7");
    			add_location(div1, file$2, 23, 10, 1206);
    			attr_dev(div2, "class", "bg-white shadow w-full rounded-lg divide-y divide-gray-200");
    			add_location(div2, file$2, 22, 8, 1123);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M10 19l-7-7m0 0l7-7m-7 7h18");
    			add_location(path, file$2, 41, 18, 2265);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4 inline-block align-text-top");
    			add_location(svg, file$2, 34, 16, 2001);
    			attr_dev(span, "class", "inline-block ml-1");
    			add_location(span, file$2, 48, 16, 2507);
    			attr_dev(button, "class", "transition duration-200 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset");
    			add_location(button, file$2, 33, 14, 1732);
    			attr_dev(div3, "class", "text-center sm:text-left whitespace-nowrap");
    			add_location(div3, file$2, 32, 12, 1661);
    			attr_dev(div4, "class", "grid grid-cols-2 gap-1");
    			add_location(div4, file$2, 31, 10, 1612);
    			attr_dev(div5, "class", "py-5");
    			add_location(div5, file$2, 30, 8, 1583);
    			attr_dev(div6, "class", "px-10 py-0 xs:p-0 mx-auto md:w-full md:max-w-md");
    			add_location(div6, file$2, 19, 6, 817);
    			attr_dev(div7, "class", "bg-gray-100 flex opacity-100 flex-col justify-center sm:py-8 rounded-lg z-20");
    			add_location(div7, file$2, 18, 4, 720);
    			attr_dev(div8, "wire:loading", "");
    			attr_dev(div8, "class", div8_class_value = "" + ((/*errorOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center"));
    			add_location(div8, file$2, 14, 0, 443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div8, t0);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t2);
    			append_dev(div6, img);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t5);
    			append_dev(div1, p0);
    			append_dev(p0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, hr);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t11);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", hideError, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*errMsg*/ 2) set_data_dev(t6, /*errMsg*/ ctx[1]);

    			if (dirty & /*errorOpen*/ 1 && div8_class_value !== (div8_class_value = "" + ((/*errorOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center"))) {
    				attr_dev(div8, "class", div8_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ErrorModal", slots, []);
    	let errorOpen, errMsg;

    	isErrorOpen.subscribe(val => {
    		$$invalidate(0, errorOpen = val);
    	});

    	errorMessage.subscribe(val => {
    		$$invalidate(1, errMsg = val);
    	});

    	const urlParams = new URLSearchParams(window.location.search);

    	if (urlParams.has("error")) {
    		urlParams.has("errorMsg")
    		? showError(urlParams.get("errorMsg"))
    		: showError();
    	}

    	
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ErrorModal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		isErrorOpen,
    		hideError,
    		showError,
    		errorMessage,
    		errorOpen,
    		errMsg,
    		urlParams
    	});

    	$$self.$inject_state = $$props => {
    		if ("errorOpen" in $$props) $$invalidate(0, errorOpen = $$props.errorOpen);
    		if ("errMsg" in $$props) $$invalidate(1, errMsg = $$props.errMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [errorOpen, errMsg];
    }

    class ErrorModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ErrorModal",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/productGrid/successModal.svelte generated by Svelte v3.38.3 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/components/productGrid/successModal.svelte";

    function create_fragment$2(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let div7;
    	let div6;
    	let h1;
    	let t2;
    	let img;
    	let img_src_value;
    	let t3;
    	let div2;
    	let div1;
    	let h3;
    	let t5;
    	let p0;
    	let t7;
    	let hr;
    	let t8;
    	let p1;
    	let t10;
    	let div5;
    	let div4;
    	let div3;
    	let button;
    	let svg;
    	let path;
    	let t11;
    	let span;
    	let div8_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "HILLCROFT LACROSSE CLUB STORE";
    			t2 = space();
    			img = element("img");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Thank you!";
    			t5 = space();
    			p0 = element("p");
    			p0.textContent = "Your purchase has been completed.";
    			t7 = space();
    			hr = element("hr");
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "If you have any questions please contact us at info@hillcroftlacrosse.com";
    			t10 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t11 = space();
    			span = element("span");
    			span.textContent = "Back to store";
    			attr_dev(div0, "class", "fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-700 opacity-50 z-10");
    			add_location(div0, file$1, 16, 4, 520);
    			attr_dev(h1, "class", "text-lg text-center font-bold");
    			add_location(h1, file$1, 20, 8, 794);
    			if (img.src !== (img_src_value = "/images/hillcroft_lacrosse_club_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Hillcroft Lacrosse Club Logo");
    			attr_dev(img, "class", "object-none object-center w-auto mx-auto py-5");
    			add_location(img, file$1, 21, 8, 879);
    			attr_dev(h3, "class", "text-center text-2xl text-green-700");
    			add_location(h3, file$1, 24, 12, 1149);
    			attr_dev(p0, "class", "text-center text-lg text-gray-light");
    			add_location(p0, file$1, 25, 12, 1225);
    			attr_dev(hr, "class", "m-5");
    			add_location(hr, file$1, 26, 12, 1322);
    			attr_dev(p1, "class", "text-center");
    			add_location(p1, file$1, 27, 12, 1352);
    			attr_dev(div1, "class", "px-5 py-7");
    			add_location(div1, file$1, 23, 10, 1113);
    			attr_dev(div2, "class", "bg-white shadow w-full rounded-lg divide-y divide-gray-200");
    			add_location(div2, file$1, 22, 8, 1030);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M10 19l-7-7m0 0l7-7m-7 7h18");
    			add_location(path, file$1, 41, 18, 2177);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4 inline-block align-text-top");
    			add_location(svg, file$1, 34, 16, 1913);
    			attr_dev(span, "class", "inline-block ml-1");
    			add_location(span, file$1, 48, 16, 2419);
    			attr_dev(button, "class", "transition duration-200 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset");
    			add_location(button, file$1, 33, 14, 1642);
    			attr_dev(div3, "class", "text-center sm:text-left whitespace-nowrap");
    			add_location(div3, file$1, 32, 12, 1571);
    			attr_dev(div4, "class", "grid grid-cols-2 gap-1");
    			add_location(div4, file$1, 31, 10, 1522);
    			attr_dev(div5, "class", "py-5");
    			add_location(div5, file$1, 30, 8, 1493);
    			attr_dev(div6, "class", "px-10 py-0 xs:p-0 mx-auto md:w-full md:max-w-md");
    			add_location(div6, file$1, 19, 6, 724);
    			attr_dev(div7, "class", "bg-gray-100 flex opacity-100 flex-col justify-center sm:py-8 rounded-lg z-20");
    			add_location(div7, file$1, 18, 4, 627);
    			attr_dev(div8, "wire:loading", "");
    			attr_dev(div8, "class", div8_class_value = "" + ((/*successOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center"));
    			add_location(div8, file$1, 14, 0, 348);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div8, t0);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t2);
    			append_dev(div6, img);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t5);
    			append_dev(div1, p0);
    			append_dev(div1, t7);
    			append_dev(div1, hr);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t11);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", hideSuccess, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*successOpen*/ 1 && div8_class_value !== (div8_class_value = "" + ((/*successOpen*/ ctx[0] ? "" : "hidden") + " fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center"))) {
    				attr_dev(div8, "class", div8_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			dispose();
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
    	validate_slots("SuccessModal", slots, []);
    	let successOpen;

    	isSuccessOpen.subscribe(val => {
    		$$invalidate(0, successOpen = val);
    	});

    	const urlParams = new URLSearchParams(window.location.search);

    	if (urlParams.has("success")) {
    		console.log("has success");
    		showSuccess();
    	}

    	
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SuccessModal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		isSuccessOpen,
    		hideSuccess,
    		showSuccess,
    		successOpen,
    		urlParams
    	});

    	$$self.$inject_state = $$props => {
    		if ("successOpen" in $$props) $$invalidate(0, successOpen = $$props.successOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [successOpen];
    }

    class SuccessModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SuccessModal",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/productGrid/ProductGrid.svelte generated by Svelte v3.38.3 */

    const { console: console_1 } = globals;
    const file = "src/components/productGrid/ProductGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (38:8) {:catch error}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Error loading products...";
    			add_location(p, file, 38, 12, 954);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(38:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (34:8) {:then products}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*products*/ ctx[1].products;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 1) {
    				each_value = /*products*/ ctx[1].products;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(34:8) {:then products}",
    		ctx
    	});

    	return block;
    }

    // (35:12) {#each products.products as product}
    function create_each_block(ctx) {
    	let producttile;
    	let current;
    	const producttile_spread_levels = [/*product*/ ctx[2]];
    	let producttile_props = {};

    	for (let i = 0; i < producttile_spread_levels.length; i += 1) {
    		producttile_props = assign(producttile_props, producttile_spread_levels[i]);
    	}

    	producttile = new ProductTile({ props: producttile_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(producttile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(producttile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const producttile_changes = (dirty & /*promise*/ 1)
    			? get_spread_update(producttile_spread_levels, [get_spread_object(/*product*/ ctx[2])])
    			: {};

    			producttile.$set(producttile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(producttile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(producttile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(producttile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:12) {#each products.products as product}",
    		ctx
    	});

    	return block;
    }

    // (32:24)              <p>Loading...</p>          {:then products}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file, 32, 12, 762);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(32:24)              <p>Loading...</p>          {:then products}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let emailmodal;
    	let t0;
    	let errormodal;
    	let t1;
    	let successmodal;
    	let t2;
    	let section;
    	let div;
    	let promise_1;
    	let current;
    	emailmodal = new EmailModal({ $$inline: true });
    	errormodal = new ErrorModal({ $$inline: true });
    	successmodal = new SuccessModal({ $$inline: true });

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1,
    		error: 5,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			create_component(emailmodal.$$.fragment);
    			t0 = space();
    			create_component(errormodal.$$.fragment);
    			t1 = space();
    			create_component(successmodal.$$.fragment);
    			t2 = space();
    			section = element("section");
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3");
    			add_location(div, file, 30, 4, 663);
    			add_location(section, file, 28, 0, 624);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(emailmodal, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(errormodal, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(successmodal, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*promise*/ 1 && promise_1 !== (promise_1 = /*promise*/ ctx[0]) && handle_promise(promise_1, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(emailmodal.$$.fragment, local);
    			transition_in(errormodal.$$.fragment, local);
    			transition_in(successmodal.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(emailmodal.$$.fragment, local);
    			transition_out(errormodal.$$.fragment, local);
    			transition_out(successmodal.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(emailmodal, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(errormodal, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(successmodal, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
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

    async function getProducts() {
    	return await fetch("/api/getProducts").then(response => response.json()).catch(error => {
    		console.log(error);
    		throw error();
    	});
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductGrid", slots, []);
    	let promise = Promise.resolve([]);

    	onMount(() => {
    		$$invalidate(0, promise = getProducts());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ProductGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		ProductTile,
    		EmailModal,
    		ErrorModal,
    		SuccessModal,
    		promise,
    		getProducts
    	});

    	$$self.$inject_state = $$props => {
    		if ("promise" in $$props) $$invalidate(0, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [promise];
    }

    class ProductGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductGrid",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.3 */

    const { document: document_1 } = globals;

    function create_fragment(ctx) {
    	let t0;
    	let header;
    	let t1;
    	let productgrid;
    	let t2;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	productgrid = new ProductGrid({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(productgrid.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			document_1.title = "Hillcroft Lacrosse Club Store";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(productgrid, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(productgrid.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(productgrid.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(productgrid, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(footer, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Footer, ProductGrid });
    	document.body.classList.add("flex", "flex-col", "w-screen", "min-h-screen", "lg:p-10", "bg-gray-100", "text-gray-800");
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
