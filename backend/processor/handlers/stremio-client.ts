import axios from 'axios';

class StremioClient {
    protected stremioAppHost: string;
    protected connected: boolean = false;

    constructor(stremioAppHost: string) {
        this.stremioAppHost = stremioAppHost;
    }
 
    protected connection(): void {        
        axios.get(this.stremioAppHost + "/settings").then((response) => {
            console.log('Connected to Stremio server');
            this.connected = true;
        }).catch((error) => {
            console.error('Could not connect to Stremio server');
            this.connected = false;
        });
    }
}

export default StremioClient;