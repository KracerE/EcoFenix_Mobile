import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemResponseDTO, TransactionType } from './src/types/models';
import { useCartStore } from './src/store/useCartStore';
import { useAuthStore } from './src/store/useAuthStore';
import { ItemDetailModal } from './src/screens/ItemDetailModal';
import { AuthScreen } from './src/screens/AuthScreen';
import { apiClient } from './src/api/client';

const CATEGORIES = ['Todas', 'Electrónica', 'Muebles', 'Ropa', 'Libros'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'PUBLISH' | 'CART' | 'PROFILE' | 'CHECKOUT' | 'AUTH'>('CATALOG');
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemResponseDTO | null>(null);

  // Filtros de Catálogo (Vista 14.1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | TransactionType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Estado Publicar Artículo (Vista 14.3)
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pubType, setPubType] = useState<TransactionType>('SOLIDARITY_SALE');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('1');
  const [category, setCategory] = useState('Electrónica');
  const [location, setLocation] = useState('Medellín');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Estado Proceso de Pago (Vista 14.6)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [cardName, setCardName] = useState('Samuel Arias');
  const [cardNumber, setCardNumber] = useState('100000000001');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Estado Mi Cuenta (Vista 14.7: Perfil, Mis Artículos, Seguridad)
  const [profileSubTab, setProfileSubTab] = useState<'PERFIL' | 'MIS_ARTICULOS' | 'SEGURIDAD'>('PERFIL');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const { user, isAuthenticated, updateProfile, logout } = useAuthStore();
  const [editFirstName, setEditFirstName] = useState(user?.firstName || 'María');
  const [editLastName, setEditLastName] = useState(user?.lastName || 'García');
  const [editUsername, setEditUsername] = useState(user?.username || 'mariag');
  const [editEmail, setEditEmail] = useState(user?.email || 'maria@example.com');
  const [editBirthDate, setEditBirthDate] = useState(user?.birthDate || '1990-05-15');
  const [editAddress, setEditAddress] = useState(user?.addresses?.[0] || 'Calle Principal 123, Medellín');

  // Estado Cambio de Contraseña (Vista 14.7.4)
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const { items: cartItems, subtotalItems, subtotalShipping, addItem, updateQuantity, removeItem, clearCart } = useCartStore();

  // Cargar artículos desde SQL Server (GET /api/items)
  const loadItemsFromDatabase = async () => {
    try {
      const response = await apiClient.get('/items');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mappedItems: ItemResponseDTO[] = response.data.map((dbItem: any) => ({
          id: dbItem.id,
          title: dbItem.title,
          description: dbItem.description,
          type: dbItem.type,
          price: dbItem.price,
          shippingCost: dbItem.shippingCost || 0,
          stock: dbItem.stock ?? 1,
          itemStatus: dbItem.itemStatus,
          categoryName:
            dbItem.categoryId === 1
              ? 'Electrónica'
              : dbItem.categoryId === 2
              ? 'Muebles'
              : dbItem.categoryId === 3
              ? 'Ropa'
              : 'Libros',
          location: dbItem.location || 'Medellín',
          imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
          sellerId: dbItem.sellerId,
          sellerName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Usuario EcoFénix',
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.log('Usando catálogo inicial mientras se agregan datos en SQL Server:', error);
    }
  };

  useEffect(() => {
    loadItemsFromDatabase();
  }, []);

  // Sincronizar datos del usuario autenticado con el formulario de Perfil y redirigir al Catálogo
  useEffect(() => {
    if (isAuthenticated && user) {
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
      setEditUsername(user.username);
      setEditEmail(user.email);
      setEditBirthDate(user.birthDate || '1990-05-15');
      setEditAddress(user.addresses?.[0] || 'Medellín');
      if (activeTab === 'AUTH') {
        setActiveTab('CATALOG');
      }
    }
  }, [isAuthenticated, user]);

  // Filtrado de catálogo (Sección 14.1 y 15.2.2)
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesCat = selectedCategory === 'Todas' || item.categoryName === selectedCategory;
    return matchesSearch && matchesType && matchesCat && item.itemStatus !== 'INACTIVE';
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCategory('Todas');
  };

  // Crear o actualizar un artículo en SQL Server
  const handlePublishItem = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Inicia sesión', 'Primero debes registrarte o iniciar sesión para publicar.');
      setActiveTab('AUTH');
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!title.trim() || !desc.trim()) {
      Alert.alert('Error', 'El título y la descripción son obligatorios');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'La ubicación es obligatoria');
      return;
    }
    if (numericPrice < 0) {
      Alert.alert('Error', 'El precio debe ser mayor o igual a 0');
      return;
    }
    if (!Number.isInteger(numericStock) || numericStock < (editingItemId ? 0 : 1)) {
      Alert.alert('Error', `El stock debe ser un número entero${editingItemId ? ' mayor o igual a 0' : ' mayor que 0'}.`);
      return;
    }

    const categoryMap: Record<string, number> = {
      Electrónica: 1,
      Muebles: 2,
      Ropa: 3,
      Libros: 4,
    };

    try {
      const itemData = {
        title,
        description: desc,
        type: pubType,
        price: pubType === 'DONATION' ? 0 : numericPrice,
        shippingCost: 0,
        stock: numericStock,
        categoryId: categoryMap[category] || 1,
        sellerId: user.id,
        location: location.trim(),
      };

      if (editingItemId !== null) {
        await apiClient.put(`/items/${editingItemId}`, itemData);
      } else {
        await apiClient.post('/items', {
          ...itemData,
          itemStatus: 'AVAILABLE',
        });
      }

      await loadItemsFromDatabase();
      const wasEditing = editingItemId !== null;
      setEditingItemId(null);
      setTitle('');
      setDesc('');
      setPrice('0');
      setStock('1');
      Alert.alert(
        wasEditing ? 'Artículo actualizado' : '¡Guardado en SQL Server!',
        wasEditing ? 'Los cambios se guardaron correctamente.' : 'El artículo se registró exitosamente en la base de datos.',
      );
      setActiveTab(wasEditing ? 'PROFILE' : 'CATALOG');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          `No se pudo ${editingItemId !== null ? 'actualizar' : 'guardar'} el artículo en la base de datos`,
      );
    }
  };

  const handleEditItem = (item: ItemResponseDTO) => {
    const categoryIdByName: Record<string, number> = {
      Electrónica: 1,
      Muebles: 2,
      Ropa: 3,
      Libros: 4,
    };

    setEditingItemId(item.id);
    setTitle(item.title);
    setDesc(item.description);
    setPubType(item.type);
    setPrice(item.price.toString());
    setStock(item.stock.toString());
    setCategory(categoryIdByName[item.categoryName] ? item.categoryName : 'Electrónica');
    setLocation(item.location);
    setActiveTab('PUBLISH');
  };

  const cancelItemEdit = () => {
    setEditingItemId(null);
    setTitle('');
    setDesc('');
    setPubType('SOLIDARITY_SALE');
    setPrice('0');
    setStock('1');
    setCategory('Electrónica');
    setLocation('Medellín');
    setActiveTab('PROFILE');
  };

  const startNewItem = () => {
    setEditingItemId(null);
    setTitle('');
    setDesc('');
    setPubType('SOLIDARITY_SALE');
    setPrice('0');
    setStock('1');
    setCategory('Electrónica');
    setLocation('Medellín');
    setActiveTab('PUBLISH');
  };

  // Eliminación lógica en SQL Server (DELETE /api/items/{id} - Sección 15.2.3)
  const handleDeleteItem = async (itemId: number) => {
    try {
      await apiClient.delete(`/items/${itemId}`);
      await loadItemsFromDatabase();
    } catch {
      // Respaldo local si es uno de los ítems de demostración iniciales
      setItems(items.map((i) => (i.id === itemId ? { ...i, itemStatus: 'INACTIVE' } : i)));
    }
  };

  const handleSaveProfile = () => {
    updateProfile({
      firstName: editFirstName,
      lastName: editLastName,
      username: editUsername,
      email: editEmail,
      birthDate: editBirthDate,
      addresses: [editAddress],
    });
    setIsEditingProfile(false);
    Alert.alert('Perfil actualizado', 'Tus cambios se han guardado correctamente.');
  };

  const handleChangePassword = () => {
    if (!currentPass || newPass.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    Alert.alert('Seguridad', 'Contraseña actualizada exitosamente.');
  };

  const handleConfirmPurchase = async () => {
    try {
      const { data } = await apiClient.post(
        '/items/purchase',
        cartItems.map(({ itemId, quantity }) => ({ itemId, quantity })),
      );

      setItems((currentItems) =>
        currentItems.map((item) => {
          const updatedItem = data.find((purchasedItem: { id: number }) => purchasedItem.id === item.id);
          return updatedItem
            ? {
                ...item,
                stock: updatedItem.stock,
                itemStatus: updatedItem.itemStatus,
              }
            : item;
        }),
      );
      clearCart();
      setCheckoutStep(3);
    } catch (error: any) {
      Alert.alert(
        'Compra no completada',
        error.response?.data?.message || 'No se pudo actualizar el inventario. Inténtalo de nuevo.',
      );
    }
  };

  const initials = `${(editFirstName?.[0] || 'U').toUpperCase()}${(editLastName?.[0] || 'E').toUpperCase()}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER ECOFÉNIX */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoRow}
          onPress={() => {
            setSelectedItem(null);
            setActiveTab('CATALOG');
          }}
        >
          <Ionicons name="leaf" size={24} color="#2E7D32" />
          <Text style={styles.logoText}>Ecofénix</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.cartBadgeBtn}
            onPress={() => {
              setSelectedItem(null);
              setActiveTab('CART');
            }}
          >
            <Ionicons name="cart-outline" size={24} color="#1B3B2B" />
            {cartItems.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.loginOutlineBtn}
              onPress={() => {
                setSelectedItem(null);
                setActiveTab('AUTH');
              }}
            >
              <Text style={styles.loginOutlineText}>Ingresar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.userChip}
              onPress={() => {
                setSelectedItem(null);
                setActiveTab('PROFILE');
              }}
            >
              <Text style={styles.userChipText}>{user?.username}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SI HAY UN ARTÍCULO SELECCIONADO, MOSTRAR VISTA DETALLE (Sección 14.4) */}
      {selectedItem ? (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={(item, qty) => {
            addItem(item, qty);
            setSelectedItem(null);
            Alert.alert('Carrito', `${item.title} agregado al carrito.`);
          }}
          onBuyNow={(item, qty) => {
            addItem(item, qty);
            setSelectedItem(null);
            setCheckoutStep(1);
            setActiveTab('CHECKOUT');
          }}
        />
      ) : (
        <>
          {/* VISTA: LOGIN Y REGISTRO (Sección 14.2) */}
          {activeTab === 'AUTH' && <AuthScreen />}

          {/* VISTA 1: CATÁLOGO (Sección 14.1) */}
          {activeTab === 'CATALOG' && (
            <FlatList
              style={styles.content}
              contentContainerStyle={styles.listContentContainer}
              data={filteredItems}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View>
                  <Text style={styles.heroTitle}>Dale una segunda vida a lo que ya no usas</Text>
                  <Text style={styles.heroSub}>
                    Donaciones y ventas solidarias para cuidar el planeta y apoyar a tu comunidad.
                  </Text>

                  <View style={styles.filterCard}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar por nombre o descripción..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    <View style={styles.filterPills}>
                      {(['ALL', 'DONATION', 'SOLIDARITY_SALE'] as const).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.pill, selectedType === t && styles.pillActive]}
                          onPress={() => setSelectedType(t)}
                        >
                          <Text style={[styles.pillText, selectedType === t && styles.pillTextActive]}>
                            {t === 'ALL' ? 'Todos' : t === 'DONATION' ? 'Donación' : 'Venta solidaria'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Filtro por Categorías */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.catChip,
                            selectedCategory === cat && styles.catChipActive,
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              selectedCategory === cat && styles.catChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={[styles.rowBetween, { marginTop: 8, flexWrap: 'wrap', gap: 8 }]}>
                      <Text style={styles.resultCount}>{filteredItems.length} artículo(s) encontrado(s)</Text>
                      <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                        <Text style={styles.clearBtnText}>Limpiar filtros</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.itemCard}
                  onPress={() => setSelectedItem(item)}
                >
                  <Image source={{ uri: item.imageUrls[0] }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View
                        style={[
                          styles.typeTag,
                          item.type === 'DONATION' ? styles.tagDonation : styles.tagSale,
                        ]}
                      >
                        <Text style={styles.typeTagText}>
                          {item.type === 'DONATION' ? 'Donación' : `$${item.price.toLocaleString()} COP`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.rowBetween}>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.greenDot,
                            item.itemStatus !== 'AVAILABLE' && { backgroundColor: '#F57C00' },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {item.itemStatus === 'AVAILABLE'
                            ? 'Disponible'
                            : item.itemStatus === 'RESERVED'
                            ? 'Reservado'
                            : 'Entregado'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.requestBtn, item.itemStatus !== 'AVAILABLE' && { opacity: 0.5 }]}
                        disabled={item.itemStatus !== 'AVAILABLE'}
                        onPress={() => {
                          addItem(item, 1);
                          Alert.alert('Carrito', `${item.title} agregado al carrito.`);
                        }}
                      >
                        <Text style={styles.requestBtnText}>Solicitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* VISTA 2: PUBLICAR ARTÍCULO (Sección 14.3) */}
          {activeTab === 'PUBLISH' && (
            <ScrollView style={styles.content} contentContainerStyle={styles.listContentContainer}>
              <Text style={styles.sectionTitle}>{editingItemId !== null ? 'Editar artículo' : 'Publicar un artículo'}</Text>
              <Text style={styles.heroSub}>Comparte lo que ya no usas. Puedes donar o vender a bajo costo.</Text>

              <View style={styles.formCard}>
                <Text style={styles.label}>Título *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej. Chaqueta de invierno"
                />

                <Text style={styles.label}>Descripción *</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  value={desc}
                  onChangeText={setDesc}
                  placeholder="Estado, características y detalles..."
                />

                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.filterPills}>
                  <TouchableOpacity
                    style={[styles.pill, pubType === 'SOLIDARITY_SALE' && styles.pillActive]}
                    onPress={() => setPubType('SOLIDARITY_SALE')}
                  >
                    <Text style={[styles.pillText, pubType === 'SOLIDARITY_SALE' && styles.pillTextActive]}>
                      Venta solidaria
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pill, pubType === 'DONATION' && styles.pillActive]}
                    onPress={() => {
                      setPubType('DONATION');
                      setPrice('0');
                    }}
                  >
                    <Text style={[styles.pillText, pubType === 'DONATION' && styles.pillTextActive]}>
                      Donación
                    </Text>
                  </TouchableOpacity>
                </View>

                {pubType === 'SOLIDARITY_SALE' && (
                  <>
                    <Text style={styles.label}>Precio (COP) *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </>
                )}

                <Text style={styles.label}>Stock *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />

                <Text style={styles.label}>Ubicación *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ej. Medellín"
                />

                <Text style={styles.label}>Categoría *</Text>
                <View style={styles.filterPills}>
                  {CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, category === cat && styles.catChipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handlePublishItem}>
                  <Text style={styles.primaryBtnText}>
                    {editingItemId !== null ? 'Guardar cambios' : 'Publicar artículo'}
                  </Text>
                </TouchableOpacity>
                {editingItemId !== null && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={cancelItemEdit}>
                    <Text style={styles.secondaryBtnText}>Cancelar edición</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* VISTA 3: CARRITO DE COMPRAS (Sección 14.5) */}
          {activeTab === 'CART' && (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Tu carrito</Text>
              {cartItems.length === 0 ? (
                <Text style={styles.emptyText}>No tienes artículos en el carrito.</Text>
              ) : (
                <>
                  <FlatList
                    data={cartItems}
                    contentContainerStyle={styles.listContentContainer}
                    keyExtractor={(i) => i.itemId.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.cartRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.cartSub}>
                            Precio unitario: ${item.unitPrice.toFixed(2)} | Envío: ${item.shippingCost.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.itemId, -1)}>
                            <Text>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{item.quantity}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.itemId, 1)}>
                            <Text>+</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => removeItem(item.itemId)} style={styles.deleteBtn}>
                          <Text style={{ color: '#C62828', fontSize: 12, fontWeight: '600' }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  <View style={styles.totalsBox}>
                    <Text style={styles.totalLine}>Subtotal productos: ${subtotalItems.toFixed(2)}</Text>
                    <Text style={styles.totalLine}>Subtotal envíos: ${subtotalShipping.toFixed(2)}</Text>
                    <Text style={styles.grandTotal}>Total: ${(subtotalItems + subtotalShipping).toFixed(2)}</Text>
                    <View style={styles.rowBetween}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={clearCart}>
                        <Text style={styles.secondaryBtnText}>Vaciar carrito</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.primaryBtn, { flex: 1, marginLeft: 12, marginTop: 0 }]}
                        onPress={() => {
                          setCheckoutStep(1);
                          setActiveTab('CHECKOUT');
                        }}
                      >
                        <Text style={styles.primaryBtnText}>Efectuar compra</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {/* VISTA 4: PROCESO DE PAGO EN 3 PASOS (Sección 14.6) */}
          {activeTab === 'CHECKOUT' && (
            <ScrollView style={styles.content} contentContainerStyle={styles.listContentContainer}>
              <Text style={styles.sectionTitle}>Proceso de pago</Text>
              <View style={styles.stepper}>
                <Text style={[styles.step, checkoutStep >= 1 && styles.stepActive]}>1. Revisión</Text>
                <Text style={[styles.step, checkoutStep >= 2 && styles.stepActive]}>2. Pago</Text>
                <Text style={[styles.step, checkoutStep === 3 && styles.stepActive]}>3. Confirmación</Text>
              </View>

              {checkoutStep === 1 && (
                <View style={styles.formCard}>
                  <Text style={styles.itemTitle}>Resumen del pedido</Text>
                  {cartItems.map((c) => (
                    <View key={c.itemId} style={[styles.rowBetween, { marginVertical: 8 }]}>
                      <Text>
                        {c.title} ({c.type === 'DONATION' ? 'Donación' : 'Venta solidaria'})
                      </Text>
                      <Text style={{ fontWeight: '700' }}>
                        {c.type === 'DONATION' ? 'Gratuito' : `$${c.totalPrice.toLocaleString()}`}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.summaryGreenBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cartSub}>Artículos con costo</Text>
                      <Text style={styles.cartSub}>
                        {cartItems.filter((i) => i.type === 'SOLIDARITY_SALE').length}
                      </Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cartSub}>Donaciones incluidas</Text>
                      <Text style={styles.cartSub}>
                        {cartItems.filter((i) => i.type === 'DONATION').length}
                      </Text>
                    </View>
                    <Text style={styles.grandTotal}>
                      Total a pagar: ${(subtotalItems + subtotalShipping).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setCheckoutStep(2)}>
                    <Text style={styles.primaryBtnText}>Continuar al pago</Text>
                  </TouchableOpacity>
                </View>
              )}

              {checkoutStep === 2 && (
                <View style={styles.formCard}>
                  <Text style={styles.itemTitle}>Datos de pago</Text>
                  <Text style={styles.label}>Nombre en la tarjeta</Text>
                  <TextInput style={styles.input} value={cardName} onChangeText={setCardName} />
                  <Text style={styles.label}>Número de tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.label}>Vencimiento</Text>
                      <TextInput style={styles.input} value={cardExpiry} onChangeText={setCardExpiry} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.label}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 16 }]}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCheckoutStep(1)}>
                      <Text style={styles.secondaryBtnText}>Volver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1, marginLeft: 10, marginTop: 0 }]}
                      onPress={handleConfirmPurchase}
                    >
                      <Text style={styles.primaryBtnText}>Confirmar pago</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {checkoutStep === 3 && (
                <View style={[styles.formCard, { alignItems: 'center', paddingVertical: 32 }]}>
                  <Ionicons name="checkmark-circle" size={68} color="#2E7D32" />
                  <Text style={[styles.sectionTitle, { marginTop: 12 }]}>¡Pago exitoso!</Text>
                  <Text style={styles.heroSub}>
                    Tu contribución solidaria ha sido procesada. Recibirás un correo con los detalles y tu factura en PDF.
                  </Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('CATALOG')}>
                    <Text style={styles.primaryBtnText}>Seguir explorando</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* VISTA 5: MI CUENTA CON LAS 3 SUB-PESTAÑAS DEL DOCUMENTO (Sección 14.7) */}
          {activeTab === 'PROFILE' && (
            <ScrollView style={styles.content} contentContainerStyle={styles.listContentContainer}>
              <Text style={styles.sectionTitle}>Mi Cuenta</Text>

              {/* Navegación interna de Mi Cuenta: Perfil | Mis Artículos | Seguridad */}
              <View style={styles.subTabBar}>
                <TouchableOpacity
                  style={[styles.subTabItem, profileSubTab === 'PERFIL' && styles.subTabItemActive]}
                  onPress={() => setProfileSubTab('PERFIL')}
                >
                  <Text style={[styles.subTabText, profileSubTab === 'PERFIL' && styles.subTabTextActive]}>
                    Perfil
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTabItem, profileSubTab === 'MIS_ARTICULOS' && styles.subTabItemActive]}
                  onPress={() => setProfileSubTab('MIS_ARTICULOS')}
                >
                  <Text style={[styles.subTabText, profileSubTab === 'MIS_ARTICULOS' && styles.subTabTextActive]}>
                    Mis Artículos ({items.filter((i) => i.itemStatus !== 'INACTIVE').length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTabItem, profileSubTab === 'SEGURIDAD' && styles.subTabItemActive]}
                  onPress={() => setProfileSubTab('SEGURIDAD')}
                >
                  <Text style={[styles.subTabText, profileSubTab === 'SEGURIDAD' && styles.subTabTextActive]}>
                    Seguridad
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SUB-PESTAÑA 1: PERFIL Y EDITAR PERFIL (14.7.1 y 14.7.2) */}
              {profileSubTab === 'PERFIL' && (
                <View style={styles.formCard}>
                  <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.itemTitle}>
                      {editFirstName} {editLastName}
                    </Text>
                  </View>

                  {!isEditingProfile ? (
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.label}>Usuario</Text>
                      <Text style={styles.profileValue}>{editUsername}</Text>
                      <Text style={styles.label}>Email</Text>
                      <Text style={styles.profileValue}>{editEmail}</Text>
                      <Text style={styles.label}>Fecha nacimiento</Text>
                      <Text style={styles.profileValue}>{editBirthDate}</Text>
                      <Text style={styles.label}>Dirección</Text>
                      <Text style={styles.profileValue}>{editAddress}</Text>

                      <View style={[styles.rowBetween, { marginTop: 18 }]}>
                        <TouchableOpacity
                          style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 20 }]}
                          onPress={() => setIsEditingProfile(true)}
                        >
                          <Text style={styles.primaryBtnText}>Editar perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={() => {
                            logout();
                            setActiveTab('AUTH');
                          }}
                        >
                          <Text style={styles.secondaryBtnText}>Cerrar sesión</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.label}>Nombre</Text>
                      <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} />
                      <Text style={styles.label}>Apellido</Text>
                      <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} />
                      <Text style={styles.label}>Email</Text>
                      <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} />
                      <Text style={styles.label}>Nombre de usuario</Text>
                      <TextInput style={styles.input} value={editUsername} onChangeText={setEditUsername} />
                      <Text style={styles.label}>Fecha de nacimiento</Text>
                      <TextInput style={styles.input} value={editBirthDate} onChangeText={setEditBirthDate} />
                      <Text style={styles.label}>Dirección</Text>
                      <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} />

                      <View style={[styles.rowBetween, { marginTop: 16 }]}>
                        <TouchableOpacity
                          style={[styles.primaryBtn, { flex: 1, marginTop: 0, marginRight: 8 }]}
                          onPress={handleSaveProfile}
                        >
                          <Text style={styles.primaryBtnText}>Guardar cambios</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={() => setIsEditingProfile(false)}
                        >
                          <Text style={styles.secondaryBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* SUB-PESTAÑA 2: MIS ARTÍCULOS (14.7.3) */}
              {profileSubTab === 'MIS_ARTICULOS' && (
                <View style={{ marginTop: 8 }}>
                  {items
                    .filter((i) => i.itemStatus !== 'INACTIVE' && i.sellerId === user?.id)
                    .map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <Image source={{ uri: item.imageUrls[0] }} style={{ width: '100%', height: 140 }} />
                        <View style={styles.itemInfo}>
                          <View style={styles.rowBetween}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.statusText}>
                              • {item.itemStatus === 'AVAILABLE'
                                ? 'Disponible'
                                : item.itemStatus === 'RESERVED'
                                ? 'Reservado'
                                : 'Entregado'}
                            </Text>
                          </View>
                          <Text style={styles.itemDesc}>{item.description}</Text>
                          <View style={[styles.rowBetween, { marginTop: 8 }]}>
                            <TouchableOpacity
                              style={styles.secondaryBtn}
                              onPress={() => handleEditItem(item)}
                            >
                              <Text style={styles.secondaryBtnText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.secondaryBtn}
                              onPress={() => {
                                setItems(
                                  items.map((i) =>
                                    i.id === item.id ? { ...i, itemStatus: 'DELIVERED' } : i
                                  )
                                );
                                Alert.alert('Estado actualizado', 'Artículo marcado como entregado/vendido.');
                              }}
                            >
                              <Text style={styles.secondaryBtnText}>Marcar como vendido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.secondaryBtn, { borderColor: '#F5C6CB' }]}
                              onPress={() => handleDeleteItem(item.id)}
                            >
                              <Text style={{ color: '#C62828', fontWeight: '600' }}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              )}

              {/* SUB-PESTAÑA 3: SEGURIDAD - CAMBIAR CONTRASEÑA (14.7.4) */}
              {profileSubTab === 'SEGURIDAD' && (
                <View style={styles.formCard}>
                  <Text style={styles.itemTitle}>Cambiar contraseña</Text>
                  <Text style={styles.label}>Contraseña actual</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={currentPass}
                    onChangeText={setCurrentPass}
                  />
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={newPass}
                    onChangeText={setNewPass}
                  />
                  <Text style={styles.label}>Confirmar nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                  />
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword}>
                    <Text style={styles.primaryBtnText}>Actualizar contraseña</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedItem(null);
            setActiveTab('CATALOG');
          }}
        >
          <Ionicons name="grid-outline" size={22} color={activeTab === 'CATALOG' ? '#2E7D32' : '#666'} />
          <Text style={[styles.navText, activeTab === 'CATALOG' && styles.navTextActive]}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedItem(null);
            startNewItem();
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color={activeTab === 'PUBLISH' ? '#2E7D32' : '#666'} />
          <Text style={[styles.navText, activeTab === 'PUBLISH' && styles.navTextActive]}>Publicar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedItem(null);
            setActiveTab('CART');
          }}
        >
          <Ionicons name="cart-outline" size={22} color={activeTab === 'CART' ? '#2E7D32' : '#666'} />
          <Text style={[styles.navText, activeTab === 'CART' && styles.navTextActive]}>Carrito</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedItem(null);
            setActiveTab('PROFILE');
          }}
        >
          <Ionicons name="person-outline" size={22} color={activeTab === 'PROFILE' ? '#2E7D32' : '#666'} />
          <Text style={[styles.navText, activeTab === 'PROFILE' && styles.navTextActive]}>Mi Cuenta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, backgroundColor: '#F6F9F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE4',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 22, fontWeight: '700', color: '#1B3B2B' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loginOutlineBtn: {
    borderWidth: 1.5,
    borderColor: '#234F32',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
  },
  loginOutlineText: { fontSize: 12, fontWeight: '700', color: '#234F32' },
  userChip: {
    backgroundColor: '#DDF3E4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
  },
  userChipText: { fontSize: 12, fontWeight: '700', color: '#1B3B2B' },
  cartBadgeBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  content: { flex: 1, minHeight: 0, paddingHorizontal: 16, paddingTop: 12 },
  listContentContainer: { paddingBottom: 28 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1B3B2B', textAlign: 'center', marginTop: 4 },
  heroSub: { fontSize: 13, color: '#4A6355', textAlign: 'center', marginVertical: 6 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1B3B2B', marginBottom: 8 },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E0EAE2',
  },
  searchInput: {
    backgroundColor: '#F2F7F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  filterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8D6CC',
  },
  pillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  pillText: { fontSize: 12, color: '#375142', fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F2F7F4',
    marginRight: 8,
  },
  catChipActive: { backgroundColor: '#DDF3E4', borderWidth: 1, borderColor: '#2E7D32' },
  catChipText: { fontSize: 12, color: '#4A6355' },
  catChipTextActive: { color: '#1B3B2B', fontWeight: '700' },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#C8D6CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 11, color: '#375142', fontWeight: '600' },
  resultCount: { fontSize: 12, color: '#687D70' },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2ECE4',
  },
  itemImage: { width: '100%', height: 170 },
  itemInfo: { padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#1B3B2B' },
  itemDesc: { fontSize: 13, color: '#5A7063', marginVertical: 6 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagDonation: { backgroundColor: '#DDF3E4' },
  tagSale: { backgroundColor: '#FFF3CD' },
  typeTagText: { fontSize: 11, fontWeight: '700', color: '#1B3B2B' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  statusText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  requestBtn: {
    borderWidth: 1,
    borderColor: '#1B3B2B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  requestBtnText: { fontSize: 12, fontWeight: '700', color: '#1B3B2B' },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0EAE2',
    marginTop: 8,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#5A7063', marginTop: 10, marginBottom: 4 },
  profileValue: { fontSize: 15, fontWeight: '600', color: '#1B3B2B' },
  input: {
    backgroundColor: '#F5F9F6',
    borderWidth: 1,
    borderColor: '#D5E2D9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtn: {
    backgroundColor: '#234F32',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#C8D6CC',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  secondaryBtnText: { color: '#375142', fontWeight: '600', fontSize: 12 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4EC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cartSub: { fontSize: 12, color: '#4A6355', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 10 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: { fontWeight: '700' },
  deleteBtn: { padding: 6 },
  totalsBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0EAE2',
  },
  totalLine: { textAlign: 'right', fontSize: 13, color: '#4A6355', marginBottom: 4 },
  grandTotal: { textAlign: 'right', fontSize: 18, fontWeight: '800', color: '#1B3B2B', marginVertical: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#687D70' },
  stepper: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  step: { fontSize: 13, color: '#8FA396', fontWeight: '600' },
  stepActive: { color: '#2E7D32', fontWeight: '800' },
  summaryGreenBox: { backgroundColor: '#EAF4EC', padding: 12, borderRadius: 10, marginTop: 12 },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D5E2D9',
    marginBottom: 12,
  },
  subTabItem: { paddingVertical: 10, marginRight: 20 },
  subTabItemActive: { borderBottomWidth: 2, borderBottomColor: '#234F32' },
  subTabText: { fontSize: 14, color: '#5A7063', fontWeight: '600' },
  subTabTextActive: { color: '#234F32', fontWeight: '800' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B8E0C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#1B3B2B' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2ECE4',
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, color: '#666', marginTop: 2 },
  navTextActive: { color: '#2E7D32', fontWeight: '700' },
});