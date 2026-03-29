import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProduct({ route, navigation }) {
  const { product } = route.params;

  const [name, setName] = useState(product.name);
  const [quantity, setQuantity] = useState(product.quantity);

  async function updateProduct() {
    const json = await AsyncStorage.getItem("products");
    const products = json ? JSON.parse(json) : [];

    const updated = products.map((p) =>
      p.id === product.id ? { ...p, name, quantity } : p
    );

    await AsyncStorage.setItem("products", JSON.stringify(updated));
    navigation.goBack();
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Nome" value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={{ borderWidth: 1, marginBottom: 10 }} />

      <Button title="Atualizar" onPress={updateProduct} />
    </View>
  );
}
