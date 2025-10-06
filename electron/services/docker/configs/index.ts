import cadvisor from "./cadvisor";
import grafana from "./grafana";
import mysqldExporter from "./mysqld-exporter";
import nodeExporter from "./node-exporter";
import prometheus from "./prometheus";
import traefik from "./traefik";
import wordpress from "./wordpress";

export default {
    traefik,
    cadvisor,
    grafana,
    mysqldExporter,
    nodeExporter,
    prometheus,
    wordpress
};
