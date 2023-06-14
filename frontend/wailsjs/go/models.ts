export namespace main {
	
	export class GetAddressResponse {
	    chain: string;
	    address: string;
	
	    static createFrom(source: any = {}) {
	        return new GetAddressResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chain = source["chain"];
	        this.address = source["address"];
	    }
	}

}

