import { FhirBundle } from "@/types/fhir";

export const sampleCqlCode = `library ExampleMeasure version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

parameter "Measurement Period" Interval<DateTime>

// Define the initial population: adult female patients
define "Initial Population":
  [Patient] P
    where P.gender = 'female'
      and AgeInYearsAt(end of "Measurement Period") >= 18

// Denominator equals initial population for this measure
define "Denominator":
  "Initial Population"

// Numerator: patients with elevated heart rate (>100 bpm)
define "Numerator":
  "Denominator" D
    with [Observation: "Heart Rate"] O
      such that O.effective during "Measurement Period"
        and O.value > 100 '{beats}/min'`;

export const diabetesCareBundle: FhirBundle = {
  resourceType: "Bundle",
  id: "diabetes-care-sample",
  type: "collection",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "patient-1",
        gender: "female",
        birthDate: "1980-05-15",
        name: [
          {
            given: ["Jane"],
            family: "Doe"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Patient",
        id: "patient-2",
        gender: "male",
        birthDate: "1975-08-22",
        name: [
          {
            given: ["John"],
            family: "Smith"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Patient",
        id: "patient-3",
        gender: "female",
        birthDate: "1990-12-03",
        name: [
          {
            given: ["Alice"],
            family: "Johnson"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Observation",
        id: "obs-1",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8867-4",
              display: "Heart rate"
            }
          ],
          text: "Heart Rate"
        },
        subject: {
          reference: "Patient/patient-1"
        },
        effectiveDateTime: "2024-03-15T10:30:00Z",
        valueQuantity: {
          value: 105,
          unit: "beats/min",
          system: "http://unitsofmeasure.org",
          code: "/min"
        }
      }
    },
    {
      resource: {
        resourceType: "Observation",
        id: "obs-2",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8867-4",
              display: "Heart rate"
            }
          ],
          text: "Heart Rate"
        },
        subject: {
          reference: "Patient/patient-2"
        },
        effectiveDateTime: "2024-02-20T14:15:00Z",
        valueQuantity: {
          value: 95,
          unit: "beats/min",
          system: "http://unitsofmeasure.org",
          code: "/min"
        }
      }
    },
    {
      resource: {
        resourceType: "Observation",
        id: "obs-3",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8867-4",
              display: "Heart rate"
            }
          ],
          text: "Heart Rate"
        },
        subject: {
          reference: "Patient/patient-3"
        },
        effectiveDateTime: "2024-04-10T09:45:00Z",
        valueQuantity: {
          value: 110,
          unit: "beats/min",
          system: "http://unitsofmeasure.org",
          code: "/min"
        }
      }
    },
    {
      resource: {
        resourceType: "Condition",
        id: "condition-1",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active"
            }
          ]
        },
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "44054006",
              display: "Diabetes mellitus type 2"
            }
          ],
          text: "Type 2 Diabetes"
        },
        subject: {
          reference: "Patient/patient-1"
        },
        onsetDateTime: "2020-01-15"
      }
    }
  ]
};

export const hypertensionBundle: FhirBundle = {
  resourceType: "Bundle",
  id: "hypertension-sample",
  type: "collection",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "patient-4",
        gender: "male",
        birthDate: "1965-03-10",
        name: [
          {
            given: ["Robert"],
            family: "Brown"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Patient",
        id: "patient-5",
        gender: "female",
        birthDate: "1970-07-25",
        name: [
          {
            given: ["Sarah"],
            family: "Wilson"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Observation",
        id: "bp-1",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel with all children optional"
            }
          ],
          text: "Blood Pressure"
        },
        subject: {
          reference: "Patient/patient-4"
        },
        effectiveDateTime: "2024-01-15T08:00:00Z",
        component: [
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8480-6",
                  display: "Systolic blood pressure"
                }
              ]
            },
            valueQuantity: {
              value: 140,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          },
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8462-4",
                  display: "Diastolic blood pressure"
                }
              ]
            },
            valueQuantity: {
              value: 90,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          }
        ]
      }
    }
  ]
};

export const sampleDatasets = [
  {
    id: "diabetes-care",
    name: "Diabetes Care Measure",
    description: "25 patients with diabetes conditions and HbA1c observations",
    bundle: diabetesCareBundle
  },
  {
    id: "hypertension",
    name: "Hypertension Screening",
    description: "30 patients with blood pressure observations",
    bundle: hypertensionBundle
  }
];
