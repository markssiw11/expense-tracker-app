import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PasswordInput } from "./PasswordInput";

type ModalType = "setup" | "change" | "disable";
type Step = "current" | "new" | "confirm";

interface PasswordModalProps {
  visible: boolean;
  modalType: ModalType | null;
  step: Step;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onPasswordComplete: (password: string) => void;
  getCurrentPasswordValue: () => string;
  isPasswordComplete: boolean;
}

export default function PasswordModal({
  visible,
  modalType,
  step,
  error,
  onClose,
  onSubmit,
  onPasswordComplete,
  getCurrentPasswordValue,
  isPasswordComplete,
}: PasswordModalProps) {
  const getModalTitle = () => {
    if (modalType === "setup") {
      return step === "new" ? "Tạo mật khẩu mới" : "Xác nhận mật khẩu";
    } else if (modalType === "change") {
      if (step === "current") return "Nhập mật khẩu hiện tại";
      if (step === "new") return "Nhập mật khẩu mới";
      return "Xác nhận mật khẩu mới";
    } else if (modalType === "disable") {
      return "Nhập mật khẩu để tắt";
    }
    return "";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{getModalTitle()}</Text>

          <PasswordInput
            key={`${modalType}-${step}`}
            length={4}
            onComplete={onPasswordComplete}
            error={error}
            value={getCurrentPasswordValue()}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                !isPasswordComplete && styles.modalSubmitButtonDisabled,
              ]}
              onPress={onSubmit}
              disabled={!isPasswordComplete}
            >
              <Text
                style={[
                  styles.modalSubmitText,
                  !isPasswordComplete && styles.modalSubmitTextDisabled,
                ]}
              >
                {step === "confirm" || modalType === "disable"
                  ? "Xác nhận"
                  : "Tiếp tục"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 24,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
  modalSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#667eea",
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalSubmitTextDisabled: {
    color: "#9CA3AF",
  },
});
