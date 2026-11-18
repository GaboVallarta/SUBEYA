import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  chevronDownOutline,
  chevronUpOutline,
  peopleOutline,
  mapOutline,
  locationOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-select-unit',
  templateUrl: './select-unit.page.html',
  styleUrls: ['./select-unit.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class SelectUnitPage implements OnInit, AfterViewInit {
  private map: any;
  private markersLayer = L.layerGroup(); 
  
  numeroCamion: string = '###';
  menuAbierto: boolean = false;
  estadoCapacidad: string = 'Vacío';
  ultimaUbicacionTexto: string = '';
  paradas: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      menuOutline,
      chevronDownOutline,
      chevronUpOutline,
      peopleOutline,
      mapOutline,
      locationOutline
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  // Añade este método en tu SelectUnitPage
  ionViewDidEnter() {
    if (this.map) {
      this.map.invalidateSize(); // Fuerza a Leaflet a recalcular el contenedor completo
    }
  }
  // Inicializar el mapa base (centrado por defecto)
  initMap() {
    if (this.map) return;

    // Coordenadas iniciales (puedes ajustarlas al centro de tu ruta)
    this.map = L.map('map').setView([20.6597, -103.3496], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Forzar redibujado inicial
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  async ngOnInit() {
    const idRuta = this.route.snapshot.paramMap.get('id');
    const nombreVisual = this.route.snapshot.queryParamMap.get('nombre');

    if (idRuta) {
      this.numeroCamion = nombreVisual ? nombreVisual.toUpperCase() : 'UNIDAD';
      // Pasamos el nombreVisual para que el mapa sepa qué color pintar desde el inicio
      await this.cargarDatosPorIdRuta(idRuta, this.numeroCamion);
      this.cdr.detectChanges();
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // Al seleccionar del menú flotante
  async seleccionarCamion(idRuta: string, nombreVisual: string) {
    this.numeroCamion = nombreVisual.toUpperCase();
    this.menuAbierto = false;

    await this.cargarDatosPorIdRuta(idRuta, this.numeroCamion);
    this.cdr.detectChanges();
  }

  // Método principal para buscar por ID de ruta y actualizar ocupación, paradas y mapa
  async cargarDatosPorIdRuta(rutaId: string, nombreCamion: string) {
    console.log(`🔍 [DEBUG] Buscando unidad por ID de ruta: "${rutaId}"`);

    try {
      const { data: unidadData, error: errorUnidad } = await this.supabaseService.getUnidades()
        .eq('ruta_id', rutaId)
        .single();

      if (errorUnidad || !unidadData) {
        console.warn(`⚠️ [DEBUG] No se encontró unidad para el ID de ruta: "${rutaId}"`, errorUnidad);
        return;
      }

      console.log('✅ [DEBUG] Unidad encontrada por ID:', unidadData);

      // Consultar la ocupación
      const ocupacion = await this.supabaseService.getUltimaOcupacion(unidadData.id);
      const totalPasajeros = ocupacion?.pasajeros_totales || 0;
      this.estadoCapacidad = this.calcularEstadoCapacidad(totalPasajeros);
      console.log(`📊 [DEBUG] Pasajeros totales: ${totalPasajeros} | Estado: "${this.estadoCapacidad}"`);

      // Consultar las paradas de la ruta
      const listaParadas = await this.supabaseService.getParadasPorRuta(rutaId);
      if (listaParadas.length > 0) {
        this.paradas = listaParadas;
      }

      // Consultar la última ubicación
      const ultimaUbicacion = await this.supabaseService.getUltimaUbicacion(unidadData.id);
      if (ultimaUbicacion && ultimaUbicacion.paradas) {
        const nombreParada = (ultimaUbicacion.paradas as any).nombre_parada;
        this.ultimaUbicacionTexto = `Última detección en: ${nombreParada}`;
      } else {
        this.ultimaUbicacionTexto = 'Sin registros recientes de ubicación';
      }

      // 🗺️ PINTAR EN EL MAPA
      this.actualizarMapaConRutaYParadas(listaParadas, ultimaUbicacion, nombreCamion);

    } catch (err) {
      console.error('❌ [DEBUG] Excepción al buscar por ID:', err);
    }
  }

  // Función para dibujar la línea de ruta y los pines en Leaflet
  actualizarMapaConRutaYParadas(paradas: any[], ultimaUbicacion: any, nombreCamion: string) {
    if (!this.map) return;

    // Limpiamos pines anteriores
    this.markersLayer.clearLayers();

    // Definir color según el camión (Azul para C-110, Rojo para C-72)
    const colorRuta = nombreCamion.includes('110') ? '#3880ff' : '#eb444a';

    const latLngs: L.LatLngExpression[] = [];

    paradas.forEach((parada, index) => {
      // Validar que la parada tenga lat y lng en tu BD
      if (parada.lat && parada.lng) {
        const coord: [number, number] = [parada.lat, parada.lng];
        latLngs.push(coord);

        // Detectar si esta parada es la última registrada
        const esUltima = ultimaUbicacion && ultimaUbicacion.paradas?.nombre_parada === parada.nombre_parada;

        // Crear pin personalizado
        const iconoPin = L.divIcon({
          className: 'custom-pin',
          html: `<div style="background-color: ${esUltima ? '#ffc409' : colorRuta}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">${index + 1}</div>`,
          iconSize: [24, 24]
        });

        const marker = L.marker(coord, { icon: iconoPin });

        if (esUltima) {
          marker.bindPopup(`<b>¡Última parada que tomó!</b><br>${parada.nombre_parada}`).openPopup();
        } else {
          marker.bindPopup(`<b>Parada:</b> ${parada.nombre_parada}`);
        }

        this.markersLayer.addLayer(marker);
      }
    });

    // Dibujar la línea de la ruta que conecta las paradas
    if (latLngs.length > 0) {
      const polyline = L.polyline(latLngs, { color: colorRuta, weight: 5, opacity: 0.7 });
      this.markersLayer.addLayer(polyline);

      // Centrar el mapa automáticamente en la ruta
      this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }

  calcularEstadoCapacidad(pasajeros: number): string {
    if (pasajeros === 0) return 'Vacío';
    if (pasajeros <= 10) return 'Disponibilidad alta';
    if (pasajeros <= 20) return 'Disponibilidad media';
    if (pasajeros <= 30) return 'Disponibilidad baja';
    return 'Lleno';
  }

  obtenerEstiloEstado(estado: string) {
    switch (estado) {
      case 'Vacío':
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
      case 'Disponibilidad alta':
        return { 'background': '#dcfce7', 'color': '#166534', 'border': '1px solid #bbf7d0' };
      case 'Disponibilidad media':
        return { 'background': '#fef9c3', 'color': '#854d0e', 'border': '1px solid #fde047' };
      case 'Disponibilidad baja':
        return { 'background': '#ffedd5', 'color': '#9a3412', 'border': '1px solid #fed7aa' };
      case 'Lleno':
        return { 'background': '#fee2e2', 'color': '#991b1b', 'border': '1px solid #fecaca' };
      default:
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
    }
  }
}