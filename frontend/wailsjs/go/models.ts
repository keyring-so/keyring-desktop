export namespace main {
	
	export class SelectResponse {
	    chain: string;
	    address: string;
	
	    static createFrom(source: any = {}) {
	        return new SelectResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chain = source["chain"];
	        this.address = source["address"];
	    }
	}

}

