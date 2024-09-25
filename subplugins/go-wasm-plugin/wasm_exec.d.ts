import { App } from 'obsidian'

type GoCallback<T extends unknown[]> = (e: Error | null, ...args: T)=>void

declare class Stat {
    isDirectory: ()=>boolean
    dev: number
    ino: number
    mode: number

    nlink: number
    uid: number
    gid: number
    rdev: number
    size: number
    blksize: number
    blocks: number
    atimeMs: number
    mtimeMs: number
    ctimeMs: number

	constructor(isDir: boolean)
}

declare let FS: {
	constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1, O_DIRECTORY: -1 }, // unused

	bindApp(app: App):void

	writeSync(fd: number, buf: Uint8Array): number
	write(fd: number, buf: Uint8Array, offset: number, length: number, position: number, callback: GoCallback<[number?]>): void
	chmod(path: string, mode: number, callback: GoCallback<[]>): void
	chown(path: string, uid: number, gid: number, callback: GoCallback<[]>): void
	close(fd: number, callback: GoCallback<[]>): void
	fchmod(fd: number, mode: number, callback: GoCallback<[]>): void
	fchown(fd: number, uid: number, gid: number, callback: GoCallback<[]>): void
	fstat(fd: number, callback: GoCallback<[number]>): void
	fsync(fd: number, callback: GoCallback<[]>): void
	ftruncate(fd: number, length: number, callback: GoCallback<[]>): void
	lchown(path: string, uid: number, gid: number, callback: GoCallback<[]>): void
	link(path: string, link: number, callback: GoCallback<[]>): void
	lstat(path: string, callback: (e: Error | null, n: Stat|null)=>void): void
	mkdir(path: string, perm: number, callback: GoCallback<[number]>): void
	open(path: string, flags: number, mode: number, callback: GoCallback<[number|null]>) : void
	read(fd: number, buffer: Uint8Array, offset: number, length: number, position: number, callback: GoCallback<[number]>) : void
	readdir(path: string, callback: GoCallback<[]>) : void
	readlink(path: string, callback: GoCallback<[]>): void
	rename(from: string, to: string, callback: GoCallback<[]>): void
	rmdir(path: string, callback: GoCallback<[(number|null)?]>): void
	stat(path: string, callback: GoCallback<[Stat|null]>) : void
	symlink(path: string, link: string, callback: GoCallback<[]>): void
	truncate(path: string, length: number, callback: GoCallback<[]>): void
	unlink(path: string, callback: GoCallback<[(number|null)?]>): void
	utimes(path: string, atime: number, mtime: number, callback: GoCallback<[]>): void
};

declare let Process: {
	getuid(): number
	getgid(): number
	geteuid(): number
	getegid(): number
	getgroups(): any
	pid: -1
	ppid: -1
	umask(): any
	cwd():string
	chdir(): any
}

declare class Go {
	argv: string[]
	env: {[key: string]: string }
	exit: (code: number)=>void
	_exitPromise: Promise<any>;
	_resolveExitPromise?: (value: any) => void;

	_pendingEvent: any | null
	_scheduledTimeouts: Map<any,any>
	_nextCallbackTimeoutID: 1

	_inst?: WebAssembly.Instance

	mem: DataView

	_values?: [ // JS values that Go currently has references to, indexed by reference id
		typeof NaN,
		0,
		null,
		true,
		false,
		typeof globalThis,
		this,
	]
	_goRefCounts?: any[]
	_ids?: Map<any, any>
	_idPool?: number[]
	
	exited: boolean

	importObject: {
		_gotest: {
			add: (a:any, b:any) => any
		},
		gojs: {
			// Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
			// may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
			// function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
			// This changes the SP, thus we have to update the SP used by the imported function.

			// func wasmExit(code int32)
			"runtime.wasmExit": (sp: number) => void

			// func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
			"runtime.wasmWrite": (sp: number) => void

			// func resetMemoryDataView()
			"runtime.resetMemoryDataView":(sp: number) => void

			// func nanotime1() int64
			"runtime.nanotime1": (sp: number) => void

			// func walltime() (sec int64, nsec int32)
			"runtime.walltime": (sp: number) => void

			// func scheduleTimeoutEvent(delay int64) int32
			"runtime.scheduleTimeoutEvent": (sp: number) => void

			// func clearTimeoutEvent(id int32)
			"runtime.clearTimeoutEvent": (sp: number) => void

			// func getRandomData(r []byte)
			"runtime.getRandomData": (sp: number) => void

			// func finalizeRef(v ref)
			"syscall/js.finalizeRef": (sp: number) => void

			// func stringVal(value string) ref
			"syscall/js.stringVal": (sp: number) => void

			// func valueGet(v ref, p string) ref
			"syscall/js.valueGet": (sp: number) => void

			// func valueSet(v ref, p string, x ref)
			"syscall/js.valueSet": (sp: number) => void

			// func valueDelete(v ref, p string)
			"syscall/js.valueDelete": (sp: number) => void

			// func valueIndex(v ref, i int) ref
			"syscall/js.valueIndex": (sp: number) => void

			// valueSetIndex(v ref, i int, x ref)
			"syscall/js.valueSetIndex": (sp: number) => void

			// func valueCall(v ref, m string, args []ref) (ref, bool)
			"syscall/js.valueCall": (sp: number) => void

			// func valueInvoke(v ref, args []ref) (ref, bool)
			"syscall/js.valueInvoke": (sp: number) => void

			// func valueNew(v ref, args []ref) (ref, bool)
			"syscall/js.valueNew": (sp: number) => void

			// func valueLength(v ref) int
			"syscall/js.valueLength": (sp: number) => void

			// valuePrepareString(v ref) (ref, int)
			"syscall/js.valuePrepareString": (sp: number) => void

			// valueLoadString(v ref, b []byte)
			"syscall/js.valueLoadString": (sp: number) => void

			// func valueInstanceOf(v ref, t ref) bool
			"syscall/js.valueInstanceOf": (sp: number) => void

			// func copyBytesToGo(dst []byte, src ref) (int, bool)
			"syscall/js.copyBytesToGo": (sp: number) => void

			// func copyBytesToJS(dst ref, src []byte) (int, bool)
			"syscall/js.copyBytesToJS": (sp: number) => void

			"debug": (value: any) => void
		}
	};

	run(instance: WebAssembly.Instance): Promise<void>
	_resume(): void
	_makeFuncWrapper(id: number): (...args: any[]) => any
}

declare global {
	let Go: Go
	let fs: typeof FS
	let process: typeof Process
}

export { FS, Process, Go, Stat }