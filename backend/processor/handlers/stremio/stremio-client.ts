import axios from 'axios';
import Configuration from '../configuration';

class StremioClient {
    protected Configuration: Configuration;
    protected connected: boolean = false;

    constructor(Configuration: Configuration) {
        this.Configuration = Configuration;
    }
 
    protected connection(): void {        
        axios.get(this.Configuration.config.stremio.stremioAppHost + "/settings").then((response) => {
            console.log('Connected to Stremio server');
            this.connected = true;
        }).catch((error) => {
            console.error('Could not connect to Stremio server');
            this.connected = false;
        });
    }
}

export default StremioClient;