// Importar shapefile del área de estudio
var aoi = ee.FeatureCollection("users/ejferrop/Antioquia_DAGRAN");

// Colección CHIRPS
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY');

// Lista de años y meses
var años = ee.List.sequence(1981, 2024);
var meses = ee.List.sequence(1, 12);

// Función para obtener la precipitación acumulada mensual para cada píxel
function calcularAcumuladoMensualPorPixel(year, month) {
  var startDate = ee.Date.fromYMD(year, month, 1);
  var endDate = startDate.advance(1, 'month');

  // Acumulado mensual dentro del área de estudio
  var acumulado = chirps
    .filterDate(startDate, endDate)
    .sum()
    .clip(aoi)
    .set('Año', year)
    .set('Mes', month);

  return acumulado;
}

// Generar una colección de imágenes con acumulados mensuales
var imagenesMensuales = años.map(function(year) {
  return meses.map(function(month) {
    return calcularAcumuladoMensualPorPixel(year, month);
  });
}).flatten();

// Convertir lista a ImageCollection
var imagenesMensualesIC = ee.ImageCollection(imagenesMensuales);

// Convertir las imágenes a puntos para exportación
var puntosPrecipitacion = imagenesMensualesIC.map(function(image) {
  var puntos = image.sample({
    region: aoi.geometry(),
    scale: 5500, // Ajustar según la resolución deseada
    projection: 'EPSG:4326',
    numPixels: 1e6, // Limitar el número de puntos si es necesario
    geometries: true
  });

  return puntos.map(function(feature) {
    return feature.set({
      'Año': image.get('Año'),
      'Mes': image.get('Mes')
    });
  });
}).flatten();

// Exportar la tabla con datos de cada píxel
Export.table.toDrive({
  collection: puntosPrecipitacion,
  description: 'Precipitacion_Pixel_Mensual_Colombia',
  folder: 'GEE_Colombia',
  fileNamePrefix: 'precipitacion_pixel_mensual',
  fileFormat: 'CSV'
});

// Centrar el mapa en el área de estudio
Map.centerObject(aoi, 6);
