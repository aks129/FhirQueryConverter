import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, FileCode, Braces, FunctionSquare, Binary, BookOpen } from "lucide-react";

interface ASTNode {
  type: string;
  [key: string]: any;
}

interface ASTViewerProps {
  cqlCode: string;
}

export function ASTViewer({ cqlCode }: ASTViewerProps) {
  // For demo purposes, create a sample AST structure based on CQL parsing
  // In a real implementation, this would come from the actual parser
  const generateSampleAST = (): ASTNode => {
    return {
      type: 'Library',
      identifier: 'SimpleCqlMeasure',
      version: '1.0.0',
      using: [{ name: 'FHIR', version: '4.0.1' }],
      parameters: [
        {
          type: 'Parameter',
          name: 'Measurement Period',
          dataType: 'Interval<DateTime>',
        },
      ],
      defines: [
        {
          type: 'Define',
          name: 'Initial Population',
          expression: {
            type: 'Query',
            source: {
              type: 'ResourceReference',
              resourceType: 'Patient',
            },
            where: {
              type: 'BinaryExpression',
              operator: '>=',
              left: {
                type: 'MemberAccess',
                object: { type: 'Identifier', name: 'Patient' },
                member: 'age',
              },
              right: {
                type: 'Literal',
                valueType: 'number',
                value: 18,
              },
            },
          },
        },
        {
          type: 'Define',
          name: 'Denominator',
          expression: {
            type: 'Identifier',
            name: 'Initial Population',
          },
        },
        {
          type: 'Define',
          name: 'Numerator',
          expression: {
            type: 'Query',
            source: {
              type: 'Identifier',
              name: 'Denominator',
            },
            relationships: [
              {
                type: 'RelationshipClause',
                relationship: 'with',
                source: {
                  type: 'ResourceReference',
                  resourceType: 'Observation',
                },
                condition: {
                  type: 'BinaryExpression',
                  operator: '>',
                  left: {
                    type: 'MemberAccess',
                    object: { type: 'Identifier', name: 'Observation' },
                    member: 'value',
                  },
                  right: {
                    type: 'Literal',
                    valueType: 'number',
                    value: 100,
                  },
                },
              },
            ],
          },
        },
      ],
    };
  };

  const ast = generateSampleAST();

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-purple-50 border border-purple-200">
        <div className="flex items-center space-x-3">
          <FileCode className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-sm font-medium text-purple-900">Abstract Syntax Tree (AST)</h3>
            <p className="text-xs text-purple-700">
              Parsed representation of CQL code structure
            </p>
          </div>
        </div>
      </Card>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <ASTNodeComponent node={ast} depth={0} />
      </div>

      <Card className="p-4 bg-gray-50 border border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Node Types Explained</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Library</Badge>
            <span className="text-gray-600">Top-level CQL document</span>
          </div>
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">Define</Badge>
            <span className="text-gray-600">Named expression definition</span>
          </div>
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Query</Badge>
            <span className="text-gray-600">FHIR resource query</span>
          </div>
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">BinaryExpression</Badge>
            <span className="text-gray-600">Binary operation (=, &gt;, &lt;, etc.)</span>
          </div>
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">MemberAccess</Badge>
            <span className="text-gray-600">Property access (e.g., Patient.age)</span>
          </div>
          <div className="flex items-start space-x-2">
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">Literal</Badge>
            <span className="text-gray-600">Constant value</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ASTNodeComponent({ node, depth }: { node: ASTNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels

  if (!node || typeof node !== 'object') {
    return (
      <span className="text-gray-600 text-xs font-mono">
        {JSON.stringify(node)}
      </span>
    );
  }

  const getNodeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Library: 'bg-blue-100 text-blue-700',
      Define: 'bg-green-100 text-green-700',
      Query: 'bg-amber-100 text-amber-700',
      BinaryExpression: 'bg-purple-100 text-purple-700',
      MemberAccess: 'bg-pink-100 text-pink-700',
      Literal: 'bg-gray-200 text-gray-700',
      Identifier: 'bg-indigo-100 text-indigo-700',
      ResourceReference: 'bg-teal-100 text-teal-700',
      RelationshipClause: 'bg-orange-100 text-orange-700',
      Parameter: 'bg-cyan-100 text-cyan-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Library':
        return <BookOpen className="w-3 h-3" />;
      case 'Define':
      case 'Query':
        return <Braces className="w-3 h-3" />;
      case 'BinaryExpression':
        return <Binary className="w-3 h-3" />;
      case 'MemberAccess':
      case 'FunctionCall':
        return <FunctionSquare className="w-3 h-3" />;
      default:
        return <FileCode className="w-3 h-3" />;
    }
  };

  const nodeType = node.type;
  const otherProps = Object.entries(node).filter(([key]) => key !== 'type');
  const hasChildren = otherProps.some(([_, value]) =>
    typeof value === 'object' && value !== null
  );

  return (
    <div className="text-xs" style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
      <div className="flex items-start space-x-2 py-1">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
        {!hasChildren && <span className="w-3" />}

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={`text-xs flex items-center space-x-1 ${getNodeColor(nodeType)}`}>
            {getNodeIcon(nodeType)}
            <span>{nodeType}</span>
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="border-l border-gray-200 ml-1.5 pl-2 mt-1">
          {otherProps.map(([key, value]) => (
            <div key={key} className="py-0.5">
              <span className="text-gray-600 font-medium">{key}: </span>
              {typeof value === 'object' && value !== null ? (
                Array.isArray(value) ? (
                  <div className="mt-1">
                    {value.map((item, index) => (
                      <ASTNodeComponent key={index} node={item} depth={depth + 1} />
                    ))}
                  </div>
                ) : (
                  <ASTNodeComponent node={value} depth={depth + 1} />
                )
              ) : (
                <span className="text-blue-600 font-mono">
                  {typeof value === 'string' ? `"${value}"` : String(value)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
