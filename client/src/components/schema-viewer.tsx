import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, Database, Key, Type } from "lucide-react";

interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  description?: string;
}

interface TableSchema {
  name: string;
  description: string;
  columns: TableColumn[];
  resourceType?: string;
}

export function SchemaViewer() {
  const tables: TableSchema[] = [
    {
      name: 'Patient',
      resourceType: 'Patient',
      description: 'Demographics and administrative information about individuals receiving care',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique patient identifier' },
        { name: 'gender', type: 'TEXT', description: 'male | female | other | unknown' },
        { name: 'birthDate', type: 'TEXT', description: 'Date of birth (YYYY-MM-DD format)' },
        { name: 'age', type: 'INTEGER', description: 'Calculated age in years' },
      ],
    },
    {
      name: 'Observation',
      resourceType: 'Observation',
      description: 'Measurements and simple assertions made about a patient',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique observation identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'code_text', type: 'TEXT', description: 'Type of observation (e.g., "Heart Rate", "BMI")' },
        { name: 'effective_datetime', type: 'TEXT', description: 'When observation was made (ISO 8601)' },
        { name: 'value_quantity', type: 'REAL', description: 'Numeric measurement value' },
        { name: 'value_unit', type: 'TEXT', description: 'Unit of measurement (e.g., "bpm", "kg/m2")' },
      ],
    },
    {
      name: 'Condition',
      resourceType: 'Condition',
      description: 'Clinical conditions, problems, diagnoses, or other health matters',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique condition identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'code_text', type: 'TEXT', description: 'Diagnosis or condition name' },
        { name: 'onset_datetime', type: 'TEXT', description: 'When condition started (ISO 8601)' },
        { name: 'clinical_status', type: 'TEXT', description: 'active | recurrence | relapse | inactive | remission | resolved' },
      ],
    },
    {
      name: 'Procedure',
      resourceType: 'Procedure',
      description: 'Surgical and diagnostic procedures performed on patients',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique procedure identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'code_text', type: 'TEXT', description: 'Procedure type (SNOMED, CPT codes)' },
        { name: 'performed_datetime', type: 'TEXT', description: 'When procedure was performed (ISO 8601)' },
        { name: 'status', type: 'TEXT', description: 'preparation | in-progress | completed | entered-in-error' },
      ],
    },
    {
      name: 'MedicationRequest',
      resourceType: 'MedicationRequest',
      description: 'Medication prescriptions and orders',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique medication request identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'medication_text', type: 'TEXT', description: 'Medication name (RxNorm codes)' },
        { name: 'authored_on', type: 'TEXT', description: 'When prescription was written (ISO 8601)' },
        { name: 'status', type: 'TEXT', description: 'active | completed | stopped | draft' },
        { name: 'intent', type: 'TEXT', description: 'proposal | plan | order | instance-order' },
      ],
    },
    {
      name: 'Encounter',
      resourceType: 'Encounter',
      description: 'Patient healthcare encounters and visits',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique encounter identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'class_code', type: 'TEXT', description: 'inpatient | outpatient | ambulatory | emergency' },
        { name: 'type_text', type: 'TEXT', description: 'Encounter type description' },
        { name: 'period_start', type: 'TEXT', description: 'Start time of encounter (ISO 8601)' },
        { name: 'period_end', type: 'TEXT', description: 'End time of encounter (ISO 8601)' },
        { name: 'status', type: 'TEXT', description: 'planned | in-progress | finished | cancelled' },
      ],
    },
    {
      name: 'DiagnosticReport',
      resourceType: 'DiagnosticReport',
      description: 'Diagnostic test results and reports',
      columns: [
        { name: 'id', type: 'TEXT', isPrimaryKey: true, description: 'Unique report identifier' },
        { name: 'subject_id', type: 'TEXT', isForeignKey: true, description: 'Reference to Patient.id' },
        { name: 'code_text', type: 'TEXT', description: 'Report type (LOINC codes)' },
        { name: 'effective_datetime', type: 'TEXT', description: 'When test was performed (ISO 8601)' },
        { name: 'issued', type: 'TEXT', description: 'When report was issued (ISO 8601)' },
        { name: 'status', type: 'TEXT', description: 'registered | partial | preliminary | final | amended' },
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT':
        return 'bg-blue-100 text-blue-700';
      case 'INTEGER':
        return 'bg-green-100 text-green-700';
      case 'REAL':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-indigo-50 border border-indigo-200">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-medium text-indigo-900">SQL on FHIR Database Schema</h3>
            <p className="text-xs text-indigo-700">
              {tables.length} tables with {tables.reduce((sum, t) => sum + t.columns.length, 0)} total columns
            </p>
          </div>
        </div>
      </Card>

      <Accordion type="multiple" defaultValue={['Patient', 'Observation']} className="w-full">
        {tables.map((table) => (
          <AccordionItem key={table.name} value={table.name} className="border border-gray-200 rounded-lg mb-2">
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center space-x-3 text-left">
                <Table className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">{table.name}</h4>
                    {table.resourceType && (
                      <Badge variant="outline" className="text-xs">
                        FHIR {table.resourceType}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{table.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Column</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Type</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Constraints</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((column, index) => (
                      <tr
                        key={column.name}
                        className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        <td className="py-2 px-3">
                          <code className="font-mono text-gray-900">{column.name}</code>
                        </td>
                        <td className="py-2 px-3">
                          <Badge className={`text-xs ${getTypeColor(column.type)}`} variant="secondary">
                            {column.type}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex space-x-1">
                            {column.isPrimaryKey && (
                              <Badge variant="default" className="text-xs bg-amber-100 text-amber-700">
                                <Key className="w-3 h-3 mr-1" />
                                PK
                              </Badge>
                            )}
                            {column.isForeignKey && (
                              <Badge variant="outline" className="text-xs">
                                FK
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{column.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="p-4 bg-gray-50 border border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Relationships</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <p>• All clinical resources (Observation, Condition, Procedure, etc.) reference Patient via <code className="font-mono bg-white px-1 py-0.5 rounded">subject_id</code></p>
          <p>• Foreign keys enable <code className="font-mono bg-white px-1 py-0.5 rounded">JOIN</code> operations across resources</p>
          <p>• Supports standard SQL on FHIR query patterns for clinical quality measures</p>
        </div>
      </Card>
    </div>
  );
}
