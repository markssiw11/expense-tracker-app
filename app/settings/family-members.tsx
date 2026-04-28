import { GoBackButton } from "@/src/components";
import useTranslation from "@/src/hooks/useTranslation";
import {
  addMember,
  deleteMember,
  FamilyMember,
  loadFamilyMembers,
  saveFamilyMembers,
  updateMember,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVAILABLE_ICONS = [
  "woman",
  "man",
  "happy",
  "people",
  "person",
  "heart",
  "star",
  "home",
];

const AVAILABLE_COLORS = [
  "#FF6B9D",
  "#4A90E2",
  "#FFA726",
  "#9C27B0",
  "#26A69A",
  "#EF5350",
  "#66BB6A",
  "#FFA000",
];

export default function FamilyMembersScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const members = useAppSelector((state) => state.family.members);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("person");
  const [selectedColor, setSelectedColor] = useState("#4A90E2");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    dispatch(loadFamilyMembers());
  }, [dispatch]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("familyMembers.nameRequired"));
      return;
    }

    let updatedMembers = [...members];

    if (editingMember) {
      dispatch(
        updateMember({
          id: editingMember.id,
          data: { name, icon: selectedIcon, color: selectedColor },
        }),
      );
      updatedMembers = members.map((m) =>
        m.id === editingMember.id
          ? { ...m, name, icon: selectedIcon, color: selectedColor }
          : m,
      );
    } else {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name,
        icon: selectedIcon,
        color: selectedColor,
      };
      dispatch(addMember(newMember));
      updatedMembers = [...members, newMember];
    }

    await dispatch(saveFamilyMembers(updatedMembers));
    closeModal();
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("common.confirm"), t("familyMembers.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          dispatch(deleteMember(id));
          await dispatch(saveFamilyMembers(members.filter((m) => m.id !== id)));
        },
      },
    ]);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setName("");
    setSelectedIcon("person");
    setSelectedColor("#4A90E2");
    setModalVisible(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setSelectedIcon(member.icon);
    setSelectedColor(member.color);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMember(null);
  };

  const renderMemberItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={[styles.memberIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={28} color="#fff" />
        </View>
        <Text style={styles.memberName}>{item.name}</Text>
      </View>
      <View style={styles.memberActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={22} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <GoBackButton />
        <View>
          <Text style={styles.headerTitle}>
            {t("familyMembers.headerTitle")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("familyMembers.headerSubtitle")}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingMember
                ? t("familyMembers.editMember")
                : t("familyMembers.addMember")}
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {t("familyMembers.nameLabel")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("familyMembers.namePlaceholder")}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {t("familyMembers.selectIcon")}
              </Text>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={selectedIcon === icon ? "#fff" : "#666"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {t("familyMembers.selectColor")}
              </Text>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeModal}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSave}
              >
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  memberName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionSelected: {
    backgroundColor: "#667eea",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#667eea",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
