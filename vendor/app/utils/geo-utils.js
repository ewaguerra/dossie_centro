(function () {
  /**
   * Geo Utils: Utilitários de geometria e BBox para o Mapa SP.
   */

  const GEO = {
    /**
     * Valida se um BBox é um array de 4 números válidos e não invertidos.
     * @param {Array} bbox [minLng, minLat, maxLng, maxLat]
     */
    isValidBbox(bbox) {
      if (!Array.isArray(bbox) || bbox.length !== 4) return false;
      if (bbox.some(n => typeof n !== "number" || isNaN(n))) return false;
      
      const [minLng, minLat, maxLng, maxLat] = bbox;
      
      // São Paulo está no quadrante Negativo/Negativo (Oeste/Sul)
      // minLng deve ser menor que maxLng (ex: -46.8 < -46.3)
      // minLat deve ser menor que maxLat (ex: -24.0 < -23.5)
      return minLng < maxLng && minLat < maxLat;
    },

    /**
     * Converte um BBox [minLng, minLat, maxLng, maxLat] para o formato Bounds do MapLibre.
     * @param {Array} bbox 
     * @returns {Array|null} [[minLng, minLat], [maxLng, maxLat]]
     */
    bboxToBounds(bbox) {
      if (!this.isValidBbox(bbox)) return null;
      return [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]]
      ];
    }
  };

  window.MAPA_SP_GEO = GEO;
})();
