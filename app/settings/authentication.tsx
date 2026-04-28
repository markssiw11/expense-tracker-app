import { GoBackButton, PasswordModal, SettingCard } from "@/src/components";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  setAuthEnabled,
  setBiometricAvailable,
  setBiometricEnabled,
} from "@/src/redux/reducers/authSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { authService } from "@/src/services/authService";
import { authStorage } from "@/src/services/storage/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ModalType = "setup" | "change" | "disable" | null;
type Step = "current" | "new" | "confirm";

export default function AuthenticationSettingsScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isEnabled, biometricEnabled, biometricAvailable } = useAppSelector(
    (state) => state.auth,
  );
  const insets = useSafeAreaInsets();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("current");
  const [isPasswordComplete, setIsPasswordComplete] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await authService.checkBiometricAvailability();
      dispatch(setBiometricAvailable(available));
    };
    checkBiometric();
  }, [dispatch]);

  useEffect(() => {
    setIsPasswordComplete(false);
  }, [step, error]);

  const handlePasswordToggle = async (value: boolean) => {
    if (value) {
      setModalType("setup");
      setStep("new");
    } else {
      setModalType("disable");
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        t("authentication.biometricNotAvailable"),
        t("authentication.biometricNotAvailableDesc"),
      );
      return;
    }

    if (!isEnabled) {
      Alert.alert(
        t("authentication.passwordRequired"),
        t("authentication.passwordRequiredDesc"),
      );
      return;
    }

    try {
      if (value) {
        const result = await authService.authenticateWithBiometric();
        if (result) {
          await authStorage.saveBiometricEnabled(true);
          dispatch(setBiometricEnabled(true));
        }
      } else {
        await authStorage.saveBiometricEnabled(false);
        dispatch(setBiometricEnabled(false));
      }
    } catch {
      Alert.alert(t("common.error"), t("authentication.biometricChangeFailed"));
    }
  };

  const handleSetupPassword = async () => {
    setError("");

    if (step === "new") {
      if (newPassword.length < 4) {
        setError(t("authentication.passwordMinLength"));
        return;
      }
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      if (newPassword !== confirmPassword) {
        setError(t("authentication.passwordMismatch"));
        setConfirmPassword("");
        return;
      }

      try {
        await authService.setupPassword(newPassword);
        dispatch(setAuthEnabled(true));
        Alert.alert(
          t("common.success"),
          t("authentication.passwordSetupSuccess"),
        );
        closeModal();
      } catch {
        setError(t("authentication.passwordSetupFailed"));
      }
    }
  };

  const handleChangePassword = async () => {
    setError("");

    if (step === "current") {
      const isValid = await authService.verifyPassword(currentPassword);
      if (!isValid) {
        setError(t("authentication.passwordIncorrect"));
        setCurrentPassword("");
        return;
      }
      setStep("new");
      return;
    }

    if (step === "new") {
      if (newPassword.length < 4) {
        setError(t("authentication.passwordMinLength"));
        return;
      }
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      if (newPassword !== confirmPassword) {
        setError(t("authentication.passwordMismatch"));
        setConfirmPassword("");
        return;
      }

      try {
        const success = await authService.changePassword(
          currentPassword,
          newPassword,
        );
        if (success) {
          Alert.alert(
            t("common.success"),
            t("authentication.passwordChangeSuccess"),
          );
          closeModal();
        } else {
          setError(t("authentication.passwordChangeFailed"));
        }
      } catch {
        setError(t("authentication.passwordChangeFailed"));
      }
    }
  };

  const handleDisableAuth = async () => {
    setError("");

    const isValid = await authService.verifyPassword(currentPassword);
    if (!isValid) {
      setError(t("authentication.passwordWrong"));
      setCurrentPassword("");
      return;
    }

    try {
      await authService.removePassword();
      dispatch(setAuthEnabled(false));
      dispatch(setBiometricEnabled(false));
      Alert.alert(
        t("common.success"),
        t("authentication.passwordDisableSuccess"),
      );
      closeModal();
    } catch {
      setError(t("authentication.passwordDisableFailed"));
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setStep("current");
    setIsPasswordComplete(false);
  };

  const handlePasswordComplete = (password: string) => {
    setIsPasswordComplete(true);
    if (modalType === "setup") {
      if (step === "new") {
        setNewPassword(password);
      } else if (step === "confirm") {
        setConfirmPassword(password);
      }
    } else if (modalType === "change") {
      if (step === "current") {
        setCurrentPassword(password);
      } else if (step === "new") {
        setNewPassword(password);
      } else if (step === "confirm") {
        setConfirmPassword(password);
      }
    } else if (modalType === "disable") {
      setCurrentPassword(password);
    }
  };

  const handleModalSubmit = () => {
    if (modalType === "setup") {
      handleSetupPassword();
    } else if (modalType === "change") {
      handleChangePassword();
    } else if (modalType === "disable") {
      handleDisableAuth();
    }
  };

  const getCurrentPasswordValue = () => {
    if (modalType === "setup") {
      return step === "new" ? newPassword : confirmPassword;
    } else if (modalType === "change") {
      if (step === "current") return currentPassword;
      if (step === "new") return newPassword;
      return confirmPassword;
    } else if (modalType === "disable") {
      return currentPassword;
    }
    return "";
  };

  const getBiometricLabel = () => {
    if (!biometricAvailable) return t("authentication.biometricNotAvailable");
    return biometricEnabled
      ? t("authentication.biometricEnabled")
      : t("authentication.biometricDisabled");
  };

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
            {t("authentication.headerTitle")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("authentication.headerSubtitle")}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("authentication.passwordProtection")}
          </Text>

          <SettingCard
            icon="lock-closed"
            label={t("authentication.enablePassword")}
            description={t("authentication.enablePasswordDesc")}
            type="switch"
            value={isEnabled}
            onValueChange={handlePasswordToggle}
          />

          {isEnabled && (
            <SettingCard
              icon="key"
              label={t("authentication.changePassword")}
              description={t("authentication.changePasswordDesc")}
              type="button"
              onPress={() => {
                setModalType("change");
                setStep("current");
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("authentication.biometricAuth")}
          </Text>

          <SettingCard
            icon="finger-print"
            label="Face ID / Touch ID"
            description={getBiometricLabel()}
            type="switch"
            value={biometricEnabled}
            disabled={!biometricAvailable || !isEnabled}
            onValueChange={handleBiometricToggle}
          />

          {!biometricAvailable && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>
                {t("authentication.biometricNotAvailableDesc")}
              </Text>
            </View>
          )}

          {!isEnabled && biometricAvailable && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                {t("authentication.enablePasswordForBiometric")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <PasswordModal
        visible={modalType !== null}
        modalType={modalType}
        step={step}
        error={error}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        onPasswordComplete={handlePasswordComplete}
        getCurrentPasswordValue={getCurrentPasswordValue}
        isPasswordComplete={isPasswordComplete}
      />
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
});
