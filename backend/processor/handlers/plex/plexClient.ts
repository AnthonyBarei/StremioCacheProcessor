import axios from "axios";
import Configuration from "../configuration";

class plexClient {
    protected Configuration: Configuration;
    protected connected: boolean = false;
 
    constructor(Configuration: Configuration) {
        this.Configuration = Configuration;
    }

    protected connection(): void {
        // http://192.168.1.5:32400/identity/?X-Plex-Token=VX4BJeB58WYGyuxDUaXq
        axios.get(`${this.Configuration.config.plex.plexAppHost}/identity?X-Plex-Token=${this.Configuration.config.plex.plexToken}`).then((res) => {
            console.log('Plex connected');
            this.connected = true;
        }).catch((err) => {
            console.error(err);
            this.connected = false;
        });
    }

    protected async getLibraries(): Promise<void> {
        try {
            // GET http://{ip_address}:32400/library/sections?X-Plex-Token={plex_token}
            const response = await axios.get(`${this.Configuration.config.plex.plexAppHost}/library/sections?X-Plex-Token=${this.Configuration.config.plex.plexToken}`);
    
            return response.data;

        } catch (error: any) {
            throw new Error(error);
        }
    }

    protected async getLibraryDetails(key: string): Promise<void> {
        // curl -X GET http://{ip_address}:32400/library/sections/{id}?X-Plex-Token={plex_token}
        try {
            const response = await axios.get(`${this.Configuration.config.plex.plexAppHost}/library/sections/${key}?X-Plex-Token=${this.Configuration.config.plex.plexToken}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    }

    protected async scanLibrary(key: string): Promise<void> {
        try {
            // GET http://{ip_address}:32400/library/sections/{id}/refresh?X-Plex-Token={plex_token}
            const response = await axios.get(`${this.Configuration.config.plex.plexAppHost}/library/sections/${key}/refresh?X-Plex-Token=${this.Configuration.config.plex.plexToken}`);            
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    }
}

export default plexClient;