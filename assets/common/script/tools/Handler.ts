    /**封装回调函数*/
    export class Handler<T>{
        /** 执行域(this)。*/
        public caller: any;
        /** 处理方法。*/
        public method: Function;
        /** 参数。*/
        public args: any[];

        constructor(caller: any = null, method: Function = null, args: any[] = null) {
            this.caller = caller;
            this.method = method;
            this.args = args;
        }
        /** 执行处理器。*/
        public run(): any {
            if (this.method == null) return null;
            let id = this.method.apply(this.caller, this.args);
            return id;
        }

        /** 执行处理器，并传递arguments。*/
        public runWith(data:T): any {
            if (this.method == null) return null;
            let id = this.args ? this.method.apply(this.caller, this.args.concat(data)) : this.method.apply(this.caller, [data]);
            return id;
        }

        /** 清理对象引用。*/
        public clear() {
            this.caller = null;
            this.method = null;
            this.args = null;
        }
    }
