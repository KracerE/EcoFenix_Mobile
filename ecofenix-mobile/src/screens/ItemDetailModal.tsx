import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemResponseDTO } from '../types/models';

interface Props {
  item: ItemResponseDTO;
  onClose: () => void;
  onAddToCart: (item: ItemResponseDTO, qty: number) => void;
  onBuyNow: (item: ItemResponseDTO, qty: number) => void;
}

export const ItemDetailModal: React.FC<Props> = ({ item, onClose, onAddToCart, onBuyNow }) => {
  const [quantity, setQuantity] = useState(1);
  const isAvailable = item.itemStatus === 'AVAILABLE' && item.stock > 0;
  const itemStatusLabel =
    item.itemStatus === 'AVAILABLE' ? 'Disponible' : item.itemStatus === 'RESERVED' ? 'Reservado' : 'Entregado';

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onClose}>
        <Ionicons name="arrow-back" size={20} color="#1B3B2B" />
        <Text style={styles.backText}>Inicio › {item.title}</Text>
      </TouchableOpacity>

      <View style={styles.detailCard}>
        <Image source={{ uri: item.imageUrls[0] }} style={styles.mainImage} />

        <View style={styles.tagsRow}>
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>
              {item.type === 'DONATION' ? 'Donación' : 'Venta solidaria'}
            </Text>
          </View>
          <View style={styles.availBadge}>
            <Text style={styles.availBadgeText}>{itemStatusLabel}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>
          {item.type === 'DONATION' ? 'Gratuito' : `$${item.price.toLocaleString()} COP`}
        </Text>
        <Text style={styles.stockInfo}>
          {Math.max(0, item.stock - quantity)} unidades disponibles después de tu selección
        </Text>

        <View style={styles.divider} />
        <Text style={styles.sectionHeader}>DESCRIPCIÓN</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.divider} />

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Cantidad:</Text>
          <View style={styles.qtySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.min(item.stock, quantity + 1))}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.outlineBtn, !isAvailable && styles.disabledBtn]}
          disabled={!isAvailable}
          onPress={() => onAddToCart(item, quantity)}
        >
          <Text style={styles.outlineBtnText}>Agregar al carrito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !isAvailable && styles.disabledBtn]}
          disabled={!isAvailable}
          onPress={() => onBuyNow(item, quantity)}
        >
          <Text style={styles.primaryBtnText}>Comprar ahora</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjetas de Impacto Ambiental y Social (Sección 14.4 y 23) */}
      <View style={styles.impactContainer}>
        <View style={styles.impactCard}>
          <Ionicons name="cube-outline" size={22} color="#8D6E63" />
          <View>
            <Text style={styles.impactTitle}>Estado</Text>
            <Text style={styles.impactSub}>{isAvailable ? 'Disponible para entrega inmediata' : itemStatusLabel}</Text>
          </View>
        </View>
        <View style={styles.impactCard}>
          <Ionicons name="heart" size={22} color="#2E7D32" />
          <View>
            <Text style={styles.impactTitle}>Venta solidaria</Text>
            <Text style={styles.impactSub}>Apoyas a tu comunidad local</Text>
          </View>
        </View>
        <View style={styles.impactCard}>
          <Ionicons name="leaf" size={22} color="#4CAF50" />
          <View>
            <Text style={styles.impactTitle}>Impacto ambiental</Text>
            <Text style={styles.impactSub}>Ayudas a reducir residuos (ODS 11 y 12)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F6', padding: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 13, color: '#1B3B2B', fontWeight: '600' },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0EAE2',
  },
  mainImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 14 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  saleBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  saleBadgeText: { fontSize: 11, fontWeight: '700', color: '#856404' },
  availBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  availBadgeText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  title: { fontSize: 22, fontWeight: '800', color: '#1B3B2B' },
  price: { fontSize: 24, fontWeight: '800', color: '#234F32', marginTop: 4 },
  stockInfo: { fontSize: 12, color: '#5A7063', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2ECE4', marginVertical: 12 },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#1B3B2B', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#4A6355', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  qtyLabel: { fontSize: 14, color: '#1B3B2B', fontWeight: '600' },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5E2D9',
    borderRadius: 8,
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#1B3B2B' },
  qtyNumber: { paddingHorizontal: 12, fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#234F32',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledBtn: { opacity: 0.5 },
  outlineBtnText: { color: '#234F32', fontWeight: '700', fontSize: 14 },
  primaryBtn: {
    backgroundColor: '#234F32',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  impactContainer: { marginTop: 14, marginBottom: 30, gap: 10 },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAE2',
  },
  impactTitle: { fontSize: 13, fontWeight: '700', color: '#1B3B2B' },
  impactSub: { fontSize: 12, color: '#5A7063' },
});