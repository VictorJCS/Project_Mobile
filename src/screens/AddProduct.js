import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddProduct({ navigation }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  async function saveProduct() {
    const json = await AsyncStorage.getItem("products");
    const products = json ? JSON.parse(json) : [];

    products.push({ id: Date.now().toString(), name, quantity });
    await AsyncStorage.setItem("products", JSON.stringify(products));

    navigation.goBack();
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Nome" value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={{ borderWidth: 1, marginBottom: 10 }} />

      <Button title="Salvar" onPress={saveProduct} />
    </View>
  );
}