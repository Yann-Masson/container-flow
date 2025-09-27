# Container Flow

## Monitoring Stack (Prometheus / Grafana)

This project provisions a monitoring stack automatically as part of the WordPress infrastructure setup. No flags required – the stack is always ensured/validated when `setup()` runs.

### Components

| Component | Image | Host Port | Purpose |
|-----------|-------|-----------|---------|
| Traefik | `traefik:v2.11` | 80 / 443 / 8080 | Reverse proxy + exposes Prometheus metrics |
| MySQL | `mysql:5.7` | 3306 | WordPress database |
| cAdvisor | `gcr.io/cadvisor/cadvisor:v0.49.1` | 8081 | Container-level CPU/Mem/IO metrics |
| mysqld-exporter | `prom/mysqld-exporter:v0.15.1` | (internal 9104) | MySQL performance metrics |
| Prometheus | `prom/prometheus:v2.53.0` | 9090 | Metrics storage and queries |
| Grafana | `grafana/grafana:11.1.4` | 3000 | Dashboards & visualization |

### Design Choices

- Prometheus configuration is generated dynamically **inside** the container (no local `prometheus.yml`).
- Traefik metrics enabled via flags (`--metrics.prometheus=*`).
- Grafana is provisioned only by environment variables for core settings; dashboards/datasource can be added later via API.
- A default "Container Flow Overview" dashboard (CPU, Memory, Network, MySQL, HTTP error rates) is auto-imported if absent.
- All monitoring containers attach to the `CF-WP` Docker network created by setup.

### Persistence

| Data | Volume |
|------|--------|
| Prometheus TSDB | `prometheus-data` |
| Grafana data | `grafana-data` |
| Traefik ACME cert storage | `traefik-acme` |
| MySQL data | `mysql-data` |

### Reconciliation / Validation

On each run of the infrastructure setup:

1. Existing containers are inspected.
2. If core image/name/config mismatches expected and `force=true`, they are removed and recreated.
3. If `force=false` and mismatch exists, setup throws an error.
4. After Grafana is running a background task ensures a Prometheus datasource exists (auto-provision). Dashboards can be added later the same way.

### Accessing Tools

| UI | URL | Notes |
|----|-----|-------|
| Grafana | http://HOST:3000 | admin / admin (change env) – Prometheus datasource auto-provisioned |
| Prometheus | http://HOST:9090 | Query metrics |
| Traefik Dashboard | http://HOST:8080 | Secure in production |

### Security Notes

- Replace default Grafana credentials in `grafana.ts` before production use.
- Consider restricting Prometheus & Grafana exposure to internal networks or behind authentication / VPN.
- ACME email and domain settings in Traefik should be updated for your environment.

---

## React + TypeScript + Vite Template

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
