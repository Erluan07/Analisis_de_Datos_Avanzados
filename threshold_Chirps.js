var threshold =30; // Umbral de precipitación en mm
  
// Filtrar los datos para el rango de años y meses
var RainfallDays = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .select('precipitation')
  .filter(ee.Filter.calendarRange(1, 12, 'month'))
  .filter(ee.Filter.calendarRange(1980, 2024, 'year'))
  .map(function(image) {
    return image.select('precipitation')
        .clip(table);
  });

// Contar los días con precipitación superior al umbral
var countAboveThreshold = RainfallDays.map(function(image) {
  var thresholdImage = image.gte(threshold);
  return thresholdImage;
}).sum();

// Crear una imagen con la suma de precipitaciones que superan el umbral
var sumAboveThreshold = RainfallDays.map(function(image) {
  var thresholdImage = image.updateMask(image.gte(threshold));
  return thresholdImage;
}).sum();

// Calcular el promedio de precipitación
var averageAboveThreshold = sumAboveThreshold.divide(countAboveThreshold);

// Centrar el mapa en la región de interés
Map.centerObject(table, 7);
Map.addLayer(countAboveThreshold, {min: 0, max: 365, palette: ['blue', 'green', 'yellow', 'red']}, 'Count of Rainfall Days Above ' + threshold + 'mm');
Map.addLayer(sumAboveThreshold, {min: 0, max: 2000, palette: ['blue', 'green', 'yellow', 'red']}, 'Sum of Precipitation Above ' + threshold + 'mm');
Map.addLayer(averageAboveThreshold, {min: 0, max: 100, palette: ['blue', 'green', 'yellow', 'red']}, 'Average Precipitation Above ' + threshold + 'mm');

// Convertir las imágenes a un tipo de dato compatible, como Int o Float
var countAboveThresholdInt = countAboveThreshold.toInt();
var sumAboveThresholdInt = sumAboveThreshold.toInt();
var averageAboveThresholdFloat = averageAboveThreshold.toFloat(); // Para mantener decimales en el promedio

// Exportar las imágenes como archivos GeoTIFF
Export.image.toDrive({
  image: countAboveThresholdInt,
  description: 'RainfallDaysAbove' + threshold + 'mm',
  folder: 'GEE_Andes', // Guardar en la carpeta GEE1
  scale: 5500, // Cambia esta escala según la resolución deseada en metros
  region: table.geometry(), // Asegúrate de que table es un FeatureCollection o Geometry
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13 // Aumenta si la región es muy grande
});

Export.image.toDrive({
  image: sumAboveThresholdInt,
  description: 'SumPrecipitationAbove' + threshold + 'mm',
  folder: 'GEE_Andes', // Guardar en la carpeta GEE1
  scale: 5500, // Cambia esta escala según la resolución deseada en metros
  region: table.geometry(), // Asegúrate de que table es un FeatureCollection o Geometry
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13 // Aumenta si la región es muy grande
});

Export.image.toDrive({
  image: averageAboveThresholdFloat,
  description: 'AveragePrecipitationAbove' + threshold + 'mm',
  folder: 'GEE_Andes', // Guardar en la carpeta GEE1
  scale: 5500, // Cambia esta escala según la resolución deseada en metros
  region: table.geometry(), // Asegúrate de que table es un FeatureCollection o Geometry
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13 // Aumenta si la región es muy grande
});