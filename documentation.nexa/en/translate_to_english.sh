#!/bin/bash

# -------------------------------------------------------------------
# Script para traducir archivos Markdown del español al inglés (in-place)
# Debe ejecutarse dentro del directorio que contiene los archivos .md
# (por ejemplo, dentro de 'en/')
# -------------------------------------------------------------------

# Configuración
API_KEY="sk-d36d74d9c9534605a5638e321ccc5af4"
API_URL="https://api.deepseek.com/v1/chat/completions"
MODEL="deepseek-chat"
SLEEP_SECONDS=1

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar API key
if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: Variable DEEPSEEK_API_KEY no configurada.${NC}"
    echo "Ejecuta: export DEEPSEEK_API_KEY='tu-api-key'"
    exit 1
fi

# Verificar jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'jq' no está instalado.${NC}"
    echo "Instálalo con: sudo apt install jq (Linux) o brew install jq (Mac)"
    exit 1
fi

# Contadores
total=0
success=0
failed=0

# Función para traducir un archivo (sobrescribe el original)
translate_file() {
    local file="$1"
    local relative_path="${file#./}"
    
    echo -e "${YELLOW}Procesando: $relative_path${NC}"
    
    # Leer contenido original
    content=$(cat "$file")
    
    # Verificar que no esté vacío
    if [ -z "$content" ]; then
        echo -e "  ${RED}⛔ Archivo vacío, omitiendo.${NC}"
        return 1
    fi
    
    # Prompt para DeepSeek
    prompt="You are a technical translator. Translate the following Markdown document from Spanish to English. Preserve all technical terms, code blocks, JSON examples, PlantUML/Mermaid diagrams, and markdown formatting exactly as they are. Do not add any commentary. Only output the translated Markdown.\n\n--- START ---\n$content\n--- END ---"
    
    # Escapar para JSON
    escaped_prompt=$(echo "$prompt" | jq -Rs .)
    
    # Construir payload
    payload=$(jq -n \
        --arg model "$MODEL" \
        --arg prompt "$escaped_prompt" \
        '{
            model: $model,
            messages: [
                { role: "system", content: "You are a technical translator. Translate Spanish to English preserving all technical accuracy and formatting." },
                { role: "user", content: ($prompt | fromjson) }
            ],
            temperature: 0.2,
            max_tokens: 8000
        }')
    
    # Llamar a la API
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "$payload")
    
    # Extraer traducción
    translated=$(echo "$response" | jq -r '.choices[0].message.content // empty')
    
    if [ -z "$translated" ] || [ "$translated" = "null" ]; then
        error_msg=$(echo "$response" | jq -r '.error.message // "Unknown error"')
        echo -e "  ${RED}❌ Error en traducción: $error_msg${NC}"
        return 1
    fi
    
    # Sobrescribir el archivo original con la traducción
    echo "$translated" > "$file"
    echo -e "  ${GREEN}✅ Traducido y guardado: $file${NC}"
    return 0
}

export -f translate_file
export API_KEY API_URL MODEL SLEEP_SECONDS
export GREEN RED YELLOW NC

echo -e "${YELLOW}Buscando archivos .md en el directorio actual y subdirectorios...${NC}"

# Recorrer todos los archivos .md (excluyendo el propio script)
find . -type f -name "*.md" ! -name "translate_inplace.sh" | while read -r file; do
    translate_file "$file"
    sleep "$SLEEP_SECONDS"
done

echo -e "${GREEN}¡Proceso completado! Archivos traducidos in-place.${NC}"