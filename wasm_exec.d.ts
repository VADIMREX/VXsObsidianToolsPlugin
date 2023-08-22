declare var fs: {
    constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 }, // unused
    writeSync(fd: any, buf: any): any /*{
        outputBuf += decoder.decode(buf);
        const nl = outputBuf.lastIndexOf("\n");
        if (nl != -1) {
            console.log(outputBuf.substring(0, nl));
            outputBuf = outputBuf.substring(nl + 1);
        }
        return buf.length;
    }*/,
    write(fd: any, buf: any, offset: any, length: any, position: any, callback: any): void/* {
        if (offset !== 0 || length !== buf.length || position !== null) {
            callback(enosys());
            return;
        }
        const n = this.writeSync(fd, buf);
        callback(null, n);
    }*/,
    chmod(path: any, mode: any, callback: any): void/* { callback(enosys()); }*/,
    chown(path: any, uid: any, gid: any, callback: any): void/* { callback(enosys()); }*/,
    close(fd: any, callback: any): void/* { callback(enosys()); }*/,
    fchmod(fd: any, mode: any, callback: any): void/* { callback(enosys()); }*/,
    fchown(fd: any, uid: any, gid: any, callback: any): void/* { callback(enosys()); }*/,
    fstat(fd: any, callback: any): void/* { callback(enosys()); }*/,
    fsync(fd: any, callback: any): void/* { callback(null); }*/,
    ftruncate(fd: any, length: any, callback: any): void/* { callback(enosys()); }*/,
    lchown(path: any, uid: any, gid: any, callback: any): void/* { callback(enosys()); }*/,
    link(path: any, link: any, callback: any): void/* { callback(enosys()); }*/,
    lstat(path: any, callback: any): void/* { callback(enosys()); }*/,
    mkdir(path: any, perm: any, callback: any): void/* { callback(enosys()); }*/,
    open(path: any, flags: any, mode: any, callback: any): void/* { callback(enosys()); }*/,
    read(fd: any, buffer: any, offset: any, length: any, position: any, callback: any): void/* { callback(enosys()); }*/,
    readdir(path: any, callback: any): void/* { callback(enosys()); }*/,
    readlink(path: any, callback: any): void/* { callback(enosys()); }*/,
    rename(from: any, to: any, callback: any): void/* { callback(enosys()); }*/,
    rmdir(path: any, callback: any): void/* { callback(enosys()); }*/,
    stat(path: any, callback: any): void/* { callback(enosys()); }*/,
    symlink(path: any, link: any, callback: any): void/* { callback(enosys()); }*/,
    truncate(path: any, length: any, callback: any): void/* { callback(enosys()); }*/,
    unlink(path: any, callback: any): void/* { callback(enosys()); }*/,
    utimes(path: any, atime: any, mtime: any, callback: any): void/* { callback(enosys()); }*/,
};

declare var process: {
    getuid(): number,// { return -1; },
    getgid(): number,// { return -1; },
    geteuid(): number,// { return -1; },
    getegid(): number,// { return -1; },
    getgroups(): void,// { throw enosys(); },
    pid: -1,
    ppid: -1,
    umask(): void,// { throw enosys(); },
    cwd(): void,// { throw enosys(); },
    chdir(): void,// { throw enosys(); },
};

declare class Go {
    argv: ["js"];
    env: {};
    exit: (code: any)=>void;
    _exitPromise: any;
    _pendingEvent: { id: any, this: any, args: any, result: any } | null;
    _scheduledTimeouts: any;
    _nextCallbackTimeoutID: any;
    importObject: {
        _gotest: {
            add: (a: any, b: any) => any, // a + b,
        },
        gojs: {
            // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
            // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
            // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
            // This changes the SP, thus we have to update the SP used by the imported function.

            // func wasmExit(code int32)
            "runtime.wasmExit": (sp: number) => void/* {
                sp >>>= 0;
                const code = this.mem.getInt32(sp + 8, true);
                this.exited = true;
                delete this._inst;
                delete this._values;
                delete this._goRefCounts;
                delete this._ids;
                delete this._idPool;
                this.exit(code);
            }*/,

            // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
            "runtime.wasmWrite": (sp: number) => void/*{
                sp >>>= 0;
                const fd = getInt64(sp + 8);
                const p = getInt64(sp + 16);
                const n = this.mem.getInt32(sp + 24, true);
                fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
            }*/,

            // func resetMemoryDataView()
            "runtime.resetMemoryDataView": (sp: number) => void/*{
                sp >>>= 0;
                this.mem = new DataView(this._inst.exports.mem.buffer);
            }*/,

            // func nanotime1() int64
            "runtime.nanotime1": (sp: number) => void/*{
                sp >>>= 0;
                setInt64(sp + 8, (timeOrigin + performance.now()) * 1000000);
            }*/,

            // func walltime() (sec int64, nsec int32)
            "runtime.walltime": (sp: number) => void/*{
                sp >>>= 0;
                const msec = (new Date).getTime();
                setInt64(sp + 8, msec / 1000);
                this.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
            }*/,

            // func scheduleTimeoutEvent(delay int64) int32
            "runtime.scheduleTimeoutEvent": (sp: number) => void/*{
                sp >>>= 0;
                const id = this._nextCallbackTimeoutID;
                this._nextCallbackTimeoutID++;
                this._scheduledTimeouts.set(id, setTimeout(
                    () => {
                        this._resume();
                        while (this._scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            this._resume();
                        }
                    },
                    getInt64(sp + 8),
                ));
                this.mem.setInt32(sp + 16, id, true);
            }*/,

            // func clearTimeoutEvent(id int32)
            "runtime.clearTimeoutEvent": (sp: number) => void/*{
                sp >>>= 0;
                const id = this.mem.getInt32(sp + 8, true);
                clearTimeout(this._scheduledTimeouts.get(id));
                this._scheduledTimeouts.delete(id);
            }*/,

            // func getRandomData(r []byte)
            "runtime.getRandomData": (sp: number) => void/*{
                sp >>>= 0;
                crypto.getRandomValues(loadSlice(sp + 8));
            }*/,

            // func finalizeRef(v ref)
            "syscall/js.finalizeRef": (sp: number) => void/*{
                sp >>>= 0;
                const id = this.mem.getUint32(sp + 8, true);
                this._goRefCounts[id]--;
                if (this._goRefCounts[id] === 0) {
                    const v = this._values[id];
                    this._values[id] = null;
                    this._ids.delete(v);
                    this._idPool.push(id);
                }
            }*/,

            // func stringVal(value string) ref
            "syscall/js.stringVal": (sp: number) => void/*{
                sp >>>= 0;
                storeValue(sp + 24, loadString(sp + 8));
            }*/,

            // func valueGet(v ref, p string) ref
            "syscall/js.valueGet": (sp: number) => void/*{
                sp >>>= 0;
                const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
                sp = this._inst.exports.getsp() >>> 0; // see comment above
                storeValue(sp + 32, result);
            }*/,

            // func valueSet(v ref, p string, x ref)
            "syscall/js.valueSet": (sp: number) => void/*{
                sp >>>= 0;
                Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
            }*/,

            // func valueDelete(v ref, p string)
            "syscall/js.valueDelete": (sp: number) => void/*{
                sp >>>= 0;
                Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
            }*/,

            // func valueIndex(v ref, i int) ref
            "syscall/js.valueIndex": (sp: number) => void/*{
                sp >>>= 0;
                storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
            }*/,

            // valueSetIndex(v ref, i int, x ref)
            "syscall/js.valueSetIndex": (sp: number) => void/*{
                sp >>>= 0;
                Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
            }*/,

            // func valueCall(v ref, m string, args []ref) (ref, bool)
            "syscall/js.valueCall": (sp: number) => void/*{
                sp >>>= 0;
                try {
                    const v = loadValue(sp + 8);
                    const m = Reflect.get(v, loadString(sp + 16));
                    const args = loadSliceOfValues(sp + 32);
                    const result = Reflect.apply(m, v, args);
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 56, result);
                    this.mem.setUint8(sp + 64, 1);
                } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 56, err);
                    this.mem.setUint8(sp + 64, 0);
                }
            }*/,

            // func valueInvoke(v ref, args []ref) (ref, bool)
            "syscall/js.valueInvoke": (sp: number) => void/*{
                sp >>>= 0;
                try {
                    const v = loadValue(sp + 8);
                    const args = loadSliceOfValues(sp + 16);
                    const result = Reflect.apply(v, undefined, args);
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                }
            }*/,

            // func valueNew(v ref, args []ref) (ref, bool)
            "syscall/js.valueNew": (sp: number) => void/*{
                sp >>>= 0;
                try {
                    const v = loadValue(sp + 8);
                    const args = loadSliceOfValues(sp + 16);
                    const result = Reflect.construct(v, args);
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                }
            }*/,

            // func valueLength(v ref) int
            "syscall/js.valueLength": (sp: number) => void/*{
                sp >>>= 0;
                setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
            }*/,

            // valuePrepareString(v ref) (ref, int)
            "syscall/js.valuePrepareString": (sp: number) => void/*{
                sp >>>= 0;
                const str = encoder.encode(String(loadValue(sp + 8)));
                storeValue(sp + 16, str);
                setInt64(sp + 24, str.length);
            }*/,

            // valueLoadString(v ref, b []byte)
            "syscall/js.valueLoadString": (sp: number) => void/*{
                sp >>>= 0;
                const str = loadValue(sp + 8);
                loadSlice(sp + 16).set(str);
            }*/,

            // func valueInstanceOf(v ref, t ref) bool
            "syscall/js.valueInstanceOf": (sp: number) => void/*{
                sp >>>= 0;
                this.mem.setUint8(sp + 24, (loadValue(sp + 8) instanceof loadValue(sp + 16)) ? 1 : 0);
            }*/,

            // func copyBytesToGo(dst []byte, src ref) (int, bool)
            "syscall/js.copyBytesToGo": (sp: number) => void/*{
                sp >>>= 0;
                const dst = loadSlice(sp + 8);
                const src = loadValue(sp + 32);
                if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                setInt64(sp + 40, toCopy.length);
                this.mem.setUint8(sp + 48, 1);
            }*/,

            // func copyBytesToJS(dst ref, src []byte) (int, bool)
            "syscall/js.copyBytesToJS": (sp: number) => void/*{
                sp >>>= 0;
                const dst = loadValue(sp + 8);
                const src = loadSlice(sp + 16);
                if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                setInt64(sp + 40, toCopy.length);
                this.mem.setUint8(sp + 48, 1);
            }*/,

            "debug": (value: any) => void/*{
                console.log(value);
            }*/,
        }
    };


    constructor(); /*{
        this.argv = ["js"];
        this.env = {};
        this.exit = (code) => {
            if (code !== 0) {
                console.warn("exit code:", code);
            }
        };
        this._exitPromise = new Promise((resolve) => {
            this._resolveExitPromise = resolve;
        });
        this._pendingEvent = null;
        this._scheduledTimeouts = new Map();
        this._nextCallbackTimeoutID = 1;

        const setInt64 = (addr, v) => {
            this.mem.setUint32(addr + 0, v, true);
            this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
        }

        const setInt32 = (addr, v) => {
            this.mem.setUint32(addr + 0, v, true);
        }

        const getInt64 = (addr) => {
            const low = this.mem.getUint32(addr + 0, true);
            const high = this.mem.getInt32(addr + 4, true);
            return low + high * 4294967296;
        }

        const loadValue = (addr) => {
            const f = this.mem.getFloat64(addr, true);
            if (f === 0) {
                return undefined;
            }
            if (!isNaN(f)) {
                return f;
            }

            const id = this.mem.getUint32(addr, true);
            return this._values[id];
        }

        const storeValue = (addr, v) => {
            const nanHead = 0x7FF80000;

            if (typeof v === "number" && v !== 0) {
                if (isNaN(v)) {
                    this.mem.setUint32(addr + 4, nanHead, true);
                    this.mem.setUint32(addr, 0, true);
                    return;
                }
                this.mem.setFloat64(addr, v, true);
                return;
            }

            if (v === undefined) {
                this.mem.setFloat64(addr, 0, true);
                return;
            }

            let id = this._ids.get(v);
            if (id === undefined) {
                id = this._idPool.pop();
                if (id === undefined) {
                    id = this._values.length;
                }
                this._values[id] = v;
                this._goRefCounts[id] = 0;
                this._ids.set(v, id);
            }
            this._goRefCounts[id]++;
            let typeFlag = 0;
            switch (typeof v) {
                case "object":
                    if (v !== null) {
                        typeFlag = 1;
                    }
                    break;
                case "string":
                    typeFlag = 2;
                    break;
                case "symbol":
                    typeFlag = 3;
                    break;
                case "function":
                    typeFlag = 4;
                    break;
            }
            this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
            this.mem.setUint32(addr, id, true);
        }

        const loadSlice = (addr) => {
            const array = getInt64(addr + 0);
            const len = getInt64(addr + 8);
            return new Uint8Array(this._inst.exports.mem.buffer, array, len);
        }

        const loadSliceOfValues = (addr) => {
            const array = getInt64(addr + 0);
            const len = getInt64(addr + 8);
            const a = new Array(len);
            for (let i = 0; i < len; i++) {
                a[i] = loadValue(array + i * 8);
            }
            return a;
        }

        const loadString = (addr) => {
            const saddr = getInt64(addr + 0);
            const len = getInt64(addr + 8);
            return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
        }

        const timeOrigin = Date.now() - performance.now();
        this.importObject = {
            _gotest: {
                add: (a, b) => a + b,
            },
            gojs: {
                // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
                // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
                // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
                // This changes the SP, thus we have to update the SP used by the imported function.

                // func wasmExit(code int32)
                "runtime.wasmExit": (sp) => {
                    sp >>>= 0;
                    const code = this.mem.getInt32(sp + 8, true);
                    this.exited = true;
                    delete this._inst;
                    delete this._values;
                    delete this._goRefCounts;
                    delete this._ids;
                    delete this._idPool;
                    this.exit(code);
                },

                // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
                "runtime.wasmWrite": (sp) => {
                    sp >>>= 0;
                    const fd = getInt64(sp + 8);
                    const p = getInt64(sp + 16);
                    const n = this.mem.getInt32(sp + 24, true);
                    fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
                },

                // func resetMemoryDataView()
                "runtime.resetMemoryDataView": (sp) => {
                    sp >>>= 0;
                    this.mem = new DataView(this._inst.exports.mem.buffer);
                },

                // func nanotime1() int64
                "runtime.nanotime1": (sp) => {
                    sp >>>= 0;
                    setInt64(sp + 8, (timeOrigin + performance.now()) * 1000000);
                },

                // func walltime() (sec int64, nsec int32)
                "runtime.walltime": (sp) => {
                    sp >>>= 0;
                    const msec = (new Date).getTime();
                    setInt64(sp + 8, msec / 1000);
                    this.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
                },

                // func scheduleTimeoutEvent(delay int64) int32
                "runtime.scheduleTimeoutEvent": (sp) => {
                    sp >>>= 0;
                    const id = this._nextCallbackTimeoutID;
                    this._nextCallbackTimeoutID++;
                    this._scheduledTimeouts.set(id, setTimeout(
                        () => {
                            this._resume();
                            while (this._scheduledTimeouts.has(id)) {
                                // for some reason Go failed to register the timeout event, log and try again
                                // (temporary workaround for https://github.com/golang/go/issues/28975)
                                console.warn("scheduleTimeoutEvent: missed timeout event");
                                this._resume();
                            }
                        },
                        getInt64(sp + 8),
                    ));
                    this.mem.setInt32(sp + 16, id, true);
                },

                // func clearTimeoutEvent(id int32)
                "runtime.clearTimeoutEvent": (sp) => {
                    sp >>>= 0;
                    const id = this.mem.getInt32(sp + 8, true);
                    clearTimeout(this._scheduledTimeouts.get(id));
                    this._scheduledTimeouts.delete(id);
                },

                // func getRandomData(r []byte)
                "runtime.getRandomData": (sp) => {
                    sp >>>= 0;
                    crypto.getRandomValues(loadSlice(sp + 8));
                },

                // func finalizeRef(v ref)
                "syscall/js.finalizeRef": (sp) => {
                    sp >>>= 0;
                    const id = this.mem.getUint32(sp + 8, true);
                    this._goRefCounts[id]--;
                    if (this._goRefCounts[id] === 0) {
                        const v = this._values[id];
                        this._values[id] = null;
                        this._ids.delete(v);
                        this._idPool.push(id);
                    }
                },

                // func stringVal(value string) ref
                "syscall/js.stringVal": (sp) => {
                    sp >>>= 0;
                    storeValue(sp + 24, loadString(sp + 8));
                },

                // func valueGet(v ref, p string) ref
                "syscall/js.valueGet": (sp) => {
                    sp >>>= 0;
                    const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
                    sp = this._inst.exports.getsp() >>> 0; // see comment above
                    storeValue(sp + 32, result);
                },

                // func valueSet(v ref, p string, x ref)
                "syscall/js.valueSet": (sp) => {
                    sp >>>= 0;
                    Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
                },

                // func valueDelete(v ref, p string)
                "syscall/js.valueDelete": (sp) => {
                    sp >>>= 0;
                    Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
                },

                // func valueIndex(v ref, i int) ref
                "syscall/js.valueIndex": (sp) => {
                    sp >>>= 0;
                    storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
                },

                // valueSetIndex(v ref, i int, x ref)
                "syscall/js.valueSetIndex": (sp) => {
                    sp >>>= 0;
                    Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
                },

                // func valueCall(v ref, m string, args []ref) (ref, bool)
                "syscall/js.valueCall": (sp) => {
                    sp >>>= 0;
                    try {
                        const v = loadValue(sp + 8);
                        const m = Reflect.get(v, loadString(sp + 16));
                        const args = loadSliceOfValues(sp + 32);
                        const result = Reflect.apply(m, v, args);
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 56, result);
                        this.mem.setUint8(sp + 64, 1);
                    } catch (err) {
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 56, err);
                        this.mem.setUint8(sp + 64, 0);
                    }
                },

                // func valueInvoke(v ref, args []ref) (ref, bool)
                "syscall/js.valueInvoke": (sp) => {
                    sp >>>= 0;
                    try {
                        const v = loadValue(sp + 8);
                        const args = loadSliceOfValues(sp + 16);
                        const result = Reflect.apply(v, undefined, args);
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, result);
                        this.mem.setUint8(sp + 48, 1);
                    } catch (err) {
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, err);
                        this.mem.setUint8(sp + 48, 0);
                    }
                },

                // func valueNew(v ref, args []ref) (ref, bool)
                "syscall/js.valueNew": (sp) => {
                    sp >>>= 0;
                    try {
                        const v = loadValue(sp + 8);
                        const args = loadSliceOfValues(sp + 16);
                        const result = Reflect.construct(v, args);
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, result);
                        this.mem.setUint8(sp + 48, 1);
                    } catch (err) {
                        sp = this._inst.exports.getsp() >>> 0; // see comment above
                        storeValue(sp + 40, err);
                        this.mem.setUint8(sp + 48, 0);
                    }
                },

                // func valueLength(v ref) int
                "syscall/js.valueLength": (sp) => {
                    sp >>>= 0;
                    setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
                },

                // valuePrepareString(v ref) (ref, int)
                "syscall/js.valuePrepareString": (sp) => {
                    sp >>>= 0;
                    const str = encoder.encode(String(loadValue(sp + 8)));
                    storeValue(sp + 16, str);
                    setInt64(sp + 24, str.length);
                },

                // valueLoadString(v ref, b []byte)
                "syscall/js.valueLoadString": (sp) => {
                    sp >>>= 0;
                    const str = loadValue(sp + 8);
                    loadSlice(sp + 16).set(str);
                },

                // func valueInstanceOf(v ref, t ref) bool
                "syscall/js.valueInstanceOf": (sp) => {
                    sp >>>= 0;
                    this.mem.setUint8(sp + 24, (loadValue(sp + 8) instanceof loadValue(sp + 16)) ? 1 : 0);
                },

                // func copyBytesToGo(dst []byte, src ref) (int, bool)
                "syscall/js.copyBytesToGo": (sp) => {
                    sp >>>= 0;
                    const dst = loadSlice(sp + 8);
                    const src = loadValue(sp + 32);
                    if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                        this.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    const toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    setInt64(sp + 40, toCopy.length);
                    this.mem.setUint8(sp + 48, 1);
                },

                // func copyBytesToJS(dst ref, src []byte) (int, bool)
                "syscall/js.copyBytesToJS": (sp) => {
                    sp >>>= 0;
                    const dst = loadValue(sp + 8);
                    const src = loadSlice(sp + 16);
                    if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                        this.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    const toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    setInt64(sp + 40, toCopy.length);
                    this.mem.setUint8(sp + 48, 1);
                },

                "debug": (value) => {
                    console.log(value);
                },
            }
        };
    };*/

    run(instance: WebAssembly.Instance): Promise<void>;

    _resume(): void;

    _makeFuncWrapper(id: any): ()=> any; /*{
        const go = this;
        return function () {
            const event = { id: id, this: this, args: arguments };
            go._pendingEvent = event;
            go._resume();
            return event.result;
        };
    }*/
}