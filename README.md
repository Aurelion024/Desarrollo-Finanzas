# FinanceTracker 🌱

**Dashboard financiero personal, interactivo y privado.** Un proyecto web de portafolio orientado a importar cartolas bancarias, organizar movimientos y simular metas de ahorro en pesos chilenos (CLP).

![Captura de FinanceTracker](assets/dashboard-preview.png)

## Funcionalidades

- **Dashboard:** ingresos, gastos propios, balance mensual estimado, dinero pendiente de devolución, gráfico de flujo de efectivo y distribución de gastos por categoría.
- **Movimientos:** agrega, edita, elimina, filtra y exporta ingresos y gastos.
- **Gastos compartidos:** divide compras al 50/50 o mediante un porcentaje personalizado; el dashboard contabiliza solo *tu parte* y muestra la parte pendiente de reembolso. Marca los gastos cuando recibas el dinero. No registres además el reembolso como ingreso ordinario si deseas evitar duplicarlo en el análisis.
- **Cartolas CSV y Excel:** lee CSV sin conexión, y XLSX/XLS con [SheetJS](https://sheetjs.com/) cargado desde CDN (requiere conexión). Asistente para asignar columnas de fecha, descripción, cargos, abonos o monto único, con vista previa, categorización sugerida, descarte de filas inválidas y detección de posibles duplicados.
- **Reglas inteligentes:** clasifica comercios frecuentes de Chile y permite añadir reglas personales basadas en palabras clave. Son reglas heurísticas, no modelos de inteligencia artificial.
- **Proyección:** simula 12 meses de ingresos, gastos y ahorro según valores y tasas de variación editables.
- **Privacidad:** toda la información se procesa en tu navegador y se guarda en `localStorage`. No hay servidor, API, autenticación, captura de credenciales ni sincronización de cuentas.
- **Respaldo:** exporta y restaura datos como JSON.

## Probar localmente

1. Descarga este proyecto y descomprime los archivos.
2. Abre `index.html` en un navegador moderno, o utiliza un servidor local:

   ```bash
   python -m http.server 8000
   ```

3. Visita `http://localhost:8000`.
4. Explora el dashboard con **datos ficticios** y luego selecciona *Configuración → Borrar todo* para comenzar desde cero.
5. Para verificar la importación, prueba [`examples/cartola_ejemplo.csv`](examples/cartola_ejemplo.csv). En el asistente comprueba el mapeo de **Fecha**, **Descripción**, **Cargo** y **Abono**.

> Importante: para archivos Excel, el lector SheetJS se carga desde un CDN. Si no está disponible, guarda la cartola como CSV desde Excel y vuelve a importarla.

## Publicar gratis en GitHub Pages

1. Crea un repositorio público llamado `financetracker-web` en tu cuenta de GitHub.
2. Sube **todo el contenido** de esta carpeta (incluidos `index.html`, `styles.css`, `app.js` y `assets/`) a la raíz del repositorio.
3. En GitHub, entra a **Settings → Pages → Build and deployment**.
4. En **Source**, selecciona **Deploy from a branch**, rama **main** y carpeta **/(root)**. Guarda los cambios.
5. Tu sitio tendrá una dirección similar a `https://TU-USUARIO.github.io/financetracker-web/`.

No requiere Node, `npm install`, compilación ni base de datos. Para editarlo, modifica los archivos de HTML, CSS y JavaScript.

## Decisiones técnicas

| Tecnología | Uso |
| --- | --- |
| HTML5 | Estructura semántica y formularios |
| CSS3 | Diseño responsive y visualizaciones |
| JavaScript | Estado, lógica de negocio, clasificación y gráficos SVG/CSS |
| `localStorage` | Persistencia en un navegador |
| SheetJS (CDN) | Lectura opcional de `.xlsx` y `.xls` |
| GitHub Pages | Alojamiento estático |

### Modelo simplificado

Una transacción contiene `id`, `date`, `description`, `amount` (siempre positivo), `type` (`gasto` o `ingreso`), `category`, `source`, `share` y `settled`.

- **Costo propio** = monto total × porcentaje propio / 100.
- **Por recuperar** = monto total − costo propio, mientras `settled` es falso.
- **Balance mensual estimado (tu parte)** = ingresos − costo propio de todos los gastos del mes.
- **Meta proyectada** = ahorro inicial + suma de ahorros mensuales simulados.

Los gráficos y recomendaciones son calculados desde los movimientos locales. La aplicación **no conoce el saldo bancario real** ni concilia depósitos automáticamente.

## Privacidad, limitaciones y alcance

- Aunque puedes publicar **el código** en GitHub Pages, **no publiques tus cartolas, respaldos ni datos financieros reales** en el repositorio. Usa el CSV de ejemplo.
- `localStorage` no está cifrado, puede eliminarse al limpiar los datos del navegador y no sincroniza entre dispositivos. Descarga respaldos JSON periódicamente y evita usar equipos compartidos.
- CSV de bancos distintos puede cambiar de estructura. Verifica las columnas y los signos antes de confirmar, ya que la identificación automática no es infalible.
- Duplicados: coincidencia en fecha, descripción, tipo, monto y fuente. Esto puede señalar por error dos transacciones auténticas idénticas; revísalas en la vista previa.
- Un reembolso por gasto compartido se refleja mediante el estado **Devuelto**, no como ingreso en la contabilidad de esta app.
- **PDFs**, conectores bancarios, IA entrenada, múltiples usuarios, presupuestos y sincronización segura quedan fuera del MVP.
- La proyección financiera es una estimación matemática, no una predicción ni asesoría financiera.

## Próximas versiones

- [ ] Importador PDF para cartolas digitales compatibles (sin OCR inicialmente).
- [ ] Presupuestos por categoría y reglas de alertas.
- [ ] Importación con formatos preconfigurados para bancos chilenos.
- [ ] API y PostgreSQL, con autenticación y cifrado adecuados.
- [ ] Clasificación de transacciones con modelos de machine learning y analítica histórica.
- [ ] Pruebas unitarias del importador y de los cálculos de división de gastos.

## Portafolio

**FinanceTracker Web — Proyecto 02**, evolución de una primera versión creada en Excel. Demuestra desarrollo frontend, procesamiento de archivos, lógica financiera, experiencia de usuario y diseño responsive.

Licencia MIT. Todo dato de demostración es ficticio.
