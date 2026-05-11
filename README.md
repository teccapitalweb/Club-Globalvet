# Club Globalvet México

Plataforma de Educación Continua Veterinaria.

## Estructura
- `index.html` - Aplicación principal del Club (miembros)
- `verificar.html` - Página pública de verificación de certificados (escaneada vía QR)

## Sistema de Certificados
Los certificados se generan al completar 100% de un curso. Cada certificado:
- Tiene folio único: `IPCI-LAT-AÑO-XXXXXX`
- Se registra en Firestore (colección `certificados`)
- Incluye QR escaneable que apunta a `verificar.html?folio=...`
- Lleva firmas digitales de Lic. Eduardo Cabrera Hernández (Director Académico) e IPCI Latinoamericano

## Despliegue
GitHub Pages: https://teccapitalweb.github.io/Club-Globalvet/
