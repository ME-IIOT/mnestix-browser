# templates/_helpers.tpl

{{- define "mnestix-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mnestix-api.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "mnestix-api.name" . }}-{{ .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}

{{- define "mnestix-api.chart" -}}
{{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "mnestix-api.labels" -}}
helm.sh/chart: {{ include "mnestix-api.chart" . }}
{{ include "mnestix-api.selectorLabels" . }}
{{- end -}}

{{- define "mnestix-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mnestix-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
