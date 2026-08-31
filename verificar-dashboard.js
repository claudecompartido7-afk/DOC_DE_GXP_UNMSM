#!/usr/bin/env node
/**
 * Verifica que los datos incrustados en Dashboard_HTML sigan siendo
 * coherentes con la fuente 4_REVISION_INTERNA DE_AVANCES_ACTIVIDADES.
 *
 *   node verificar-dashboard.js
 *
 * No necesita red ni navegador: lee el bloque DATOS_FUENTE del propio
 * archivo y comprueba la aritmetica y la integridad del catalogo.
 */
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/Dashboard_HTML', 'utf8');
const m = html.match(/const DATOS_FUENTE = ([\s\S]*?);\n/);
if (!m) { console.error('No se encontro el bloque DATOS_FUENTE.'); process.exit(1); }
const D = JSON.parse(m[1]);

let fallos = 0, n = 0;
const ok = (t, c, x) => { n++; console.log((c ? '  ok    ' : '  FALLA ') + t + (c ? '' : '   -> ' + x)); if (!c) fallos++; };
const gr = t => console.log('\n' + t);

gr('Catalogo de facultades');
ok('son 20', D.facultades.length === 20, D.facultades.length);
ok('no hay siglas repetidas', new Set(D.facultades.map(f => f.sigla)).size === 20);
ok('no hay codigos repetidos', new Set(D.facultades.map(f => f.codigo)).size === 20);
ok('no hay nombres repetidos', new Set(D.facultades.map(f => f.nombre)).size === 20);
ok('cada codigo termina en su sigla',
   D.facultades.every(f => f.codigo.endsWith('_' + f.sigla)),
   D.facultades.filter(f => !f.codigo.endsWith('_' + f.sigla)).map(f => f.codigo).join(','));
// El orden de la relacion no coincide con el numero del codigo en las cuatro
// ultimas. Si alguna vez coincidiera del todo, es que se reordeno mal.
const especiales = { FII: 'F20_FII', FPSIC: 'F17_FPSIC', FIEE: 'F18_FIEE', FISI: 'F19_FISI' };
for (const [sig, cod] of Object.entries(especiales)) {
  const f = D.facultades.find(x => x.sigla === sig);
  ok(sig + ' conserva su codigo ' + cod, f && f.codigo === cod, f && f.codigo);
}

gr('Aritmetica de los indicadores');
const T = D.totales;
const suma = (k, s) => D.facultades.reduce((a, f) => a + f[k][s], 0);
ok('productos conformes cuadran con las facultades', suma('productos', 'conformes') === T.prodConf);
ok('productos observados cuadran', suma('productos', 'observados') === T.prodObs);
ok('productos sin registrar cuadran', suma('productos', 'sinRegistrar') === T.prodSin);
ok('fichas completas cuadran', suma('fichas', 'completas') === T.fichComp);
ok('fichas incompletas cuadran', suma('fichas', 'incompletas') === T.fichIncomp);
ok('fichas sin producto cuadran', suma('fichas', 'sinProducto') === T.fichSin);

const m1 = D.facultades.reduce((a, f) => a + f.pctAnexo1, 0) / 20;
const m3 = D.facultades.reduce((a, f) => a + f.pctAnexo3, 0) / 20;
ok('el KPI del Anexo 1 es el promedio de las 20', Math.abs(m1 - D.kpi.anexo1) < 0.05, m1.toFixed(2));
ok('el KPI del Anexo 3 es el promedio de las 20', Math.abs(m3 - D.kpi.anexo3) < 0.05, m3.toFixed(2));
ok('el avance general es la media de ambos anexos',
   Math.abs((m1 + m3) / 2 - D.kpi.general) < 0.1, ((m1 + m3) / 2).toFixed(2));

gr('Registros de detalle');
ok('hay registros', D.registros.length > 0, D.registros.length);
ok('cada registro apunta a una facultad del catalogo',
   D.registros.every(r => D.facultades.some(f => f.codigo === r.faculty)),
   [...new Set(D.registros.filter(r => !D.facultades.some(f => f.codigo === r.faculty)).map(r => r.faculty))].join(','));
ok('los identificadores no se repiten', new Set(D.registros.map(r => r.id)).size === D.registros.length);
ok('ningun codigo de producto es de los inventados (P-001)',
   !D.registros.some(r => /^P-\d{3}$/.test(r.code)));

gr('Cobertura de las hojas de detalle');
for (const ent of ['Producto', 'Proceso', 'SubProceso', 'Ficha']) {
  const fac = new Set(D.registros.filter(r => r.entity === ent).map(r => r.faculty));
  console.log('  ' + ent.padEnd(11) + fac.size + '/20 facultades con detalle');
}
const totProd = D.facultades.reduce((a, f) => a + f.productos.total, 0);
console.log('  La fuente cuenta ' + totProd + ' productos y detalla ' +
            D.registros.filter(r => r.entity === 'Producto').length + '.');

console.log('\n' + n + ' comprobaciones - ' + (fallos ? fallos + ' FALLA(S)' : 'todas correctas') + '\n');
process.exit(fallos ? 1 : 0);
