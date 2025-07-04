"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, RefreshCw, AlertTriangle, Info } from "lucide-react";
import {
  completelyDeleteUser,
  cleanOrphanedUser,
  generateCleanupReport,
} from "@/lib/firebase/adminUtils";

export default function AdminCleanupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [report, setReport] = useState("");

  const showMessage = (text: string, type: "success" | "error" | "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleCompleteDelete = async () => {
    if (!email || !password) {
      showMessage("Por favor ingresa email y contraseña", "error");
      return;
    }

    setLoading(true);
    try {
      await completelyDeleteUser(email, password);
      showMessage(
        "Usuario eliminado completamente de Auth y Firestore",
        "success"
      );
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error:", error);
      showMessage(
        "Error al eliminar usuario: " + (error as Error).message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCleanOrphaned = async () => {
    if (!email || !password) {
      showMessage("Por favor ingresa email y contraseña", "error");
      return;
    }

    setLoading(true);
    try {
      await cleanOrphanedUser(email, password);
      showMessage("Usuario huérfano eliminado de Firebase Auth", "success");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error:", error);
      showMessage(
        "Error al limpiar usuario huérfano: " + (error as Error).message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportText = await generateCleanupReport();
      setReport(reportText);
      showMessage("Reporte generado exitosamente", "success");
    } catch (error) {
      console.error("Error:", error);
      showMessage(
        "Error al generar reporte: " + (error as Error).message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛠️ Panel de Administración - Limpieza de Usuarios
          </h1>
          <p className="text-gray-600">
            Herramientas para limpiar usuarios huérfanos y problemas de
            sincronización
          </p>
        </div>{" "}
        {/* Warning Alert */}
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <strong>¡ATENCIÓN!</strong> Estas herramientas eliminan datos
              permanentemente. Úsalas solo si entiendes completamente las
              consecuencias.
            </div>
          </div>
        </div>
        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : messageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info
                className={`h-4 w-4 ${
                  messageType === "success"
                    ? "text-green-600"
                    : messageType === "error"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              />
              <span>{message}</span>
            </div>
          </div>
        )}
        {/* User Cleanup Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Limpieza de Usuario Específico
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email del usuario problemático
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña del usuario
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña del usuario"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Necesaria para eliminar de Firebase Auth
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Button
                onClick={handleCleanOrphaned}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Limpiar Usuario Huérfano
              </Button>

              <Button
                onClick={handleCompleteDelete}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Eliminar Completamente
              </Button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Usuario Huérfano:</strong> Existe en Firebase Auth pero no
              en Firestore
              <br />
              <strong>Eliminar Completamente:</strong> Elimina de ambos Firebase
              Auth y Firestore
            </div>
          </div>
        </Card>
        {/* Generate Report */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Reporte de Estado
          </h2>

          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="mb-4"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Generar Reporte de Usuarios
          </Button>

          {report && (
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-96">
              <pre>{report}</pre>
            </div>
          )}
        </Card>
        {/* Instructions */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            📋 Instrucciones de Uso
          </h2>

          <div className="space-y-3 text-blue-800">
            <div>
              <strong>Problema:</strong> Tus amigos eliminados de Firestore no
              pueden registrarse.
            </div>

            <div>
              <strong>Causa:</strong> Sus cuentas siguen existiendo en Firebase
              Auth aunque eliminaste sus datos de Firestore.
            </div>

            <div>
              <strong>Soluciones:</strong>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>
                  <strong>Automática:</strong> Que intenten iniciar sesión - el
                  sistema recreará sus perfiles
                </li>
                <li>
                  <strong>Manual:</strong> Usa esta herramienta para eliminar
                  completamente sus cuentas
                </li>
              </ol>
            </div>

            <div>
              <strong>Recomendación:</strong> La solución automática es más
              segura. Solo usa la manual si la automática no funciona.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
