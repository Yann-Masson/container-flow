import { NetworkInspectInfo } from "dockerode";

export default function networkConfig(networkInfo: NetworkInspectInfo) {
    return networkInfo.Driver === 'bridge' && networkInfo.Name === 'CF-WP';
}
