import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';

// Define tools that Claude can use
export const chatTools: Anthropic.Tool[] = [
  {
    name: 'create_case',
    description:
      'Create a new case in the system. Use this when the user wants to create a case.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the case',
        },
        caseNumber: {
          type: 'string',
          description: 'The case number (optional, will be generated if not provided)',
        },
        caseType: {
          type: 'string',
          description: 'Type of case (e.g., civil, criminal)',
        },
        plaintiffName: {
          type: 'string',
          description: 'Name of the plaintiff',
        },
        defendantName: {
          type: 'string',
          description: 'Name of the defendant',
        },
        ourSide: {
          type: 'string',
          description: 'Which side we represent (plaintiff or defendant)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_cases',
    description: 'List all cases for the current organization',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_case',
    description: 'Get details of a specific case by ID',
    input_schema: {
      type: 'object',
      properties: {
        caseId: {
          type: 'string',
          description: 'The ID of the case to retrieve',
        },
      },
      required: ['caseId'],
    },
  },
  {
    name: 'add_juror',
    description: 'Add a new juror to a case',
    input_schema: {
      type: 'object',
      properties: {
        caseId: {
          type: 'string',
          description: 'The ID of the case',
        },
        name: {
          type: 'string',
          description: 'Juror full name',
        },
        age: {
          type: 'number',
          description: 'Juror age',
        },
        gender: {
          type: 'string',
          description: 'Juror gender',
        },
        occupation: {
          type: 'string',
          description: 'Juror occupation',
        },
        education: {
          type: 'string',
          description: 'Juror education level',
        },
      },
      required: ['caseId', 'name'],
    },
  },
  {
    name: 'classify_juror_archetype',
    description:
      'Classify a juror into one of the 10 psychological archetypes using AI',
    input_schema: {
      type: 'object',
      properties: {
        jurorId: {
          type: 'string',
          description: 'The ID of the juror to classify',
        },
      },
      required: ['jurorId'],
    },
  },
];

// Execute a tool call
export async function executeTool(
  server: FastifyInstance,
  toolName: string,
  toolInput: Record<string, any>,
  user: { userId: string; organizationId: string }
): Promise<{ result: any; error?: string }> {
  try {
    switch (toolName) {
      case 'create_case': {
        const caseData = {
          ...toolInput,
          organizationId: user.organizationId,
          createdBy: user.userId,
          status: 'active',
        };

        const newCase = await server.prisma.case.create({
          data: caseData,
        });

        return {
          result: {
            success: true,
            case: newCase,
            message: `Case "${newCase.name}" created successfully with ID: ${newCase.id}`,
          },
        };
      }

      case 'list_cases': {
        const cases = await server.prisma.case.findMany({
          where: { organizationId: user.organizationId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        return {
          result: {
            success: true,
            cases,
            count: cases.length,
          },
        };
      }

      case 'get_case': {
        const caseDetails = await server.prisma.case.findFirst({
          where: {
            id: toolInput.caseId,
            organizationId: user.organizationId,
          },
          include: {
            _count: {
              select: {
                juryPanels: true,
                facts: true,
                arguments: true,
              },
            },
          },
        });

        if (!caseDetails) {
          return {
            result: null,
            error: 'Case not found',
          };
        }

        return {
          result: {
            success: true,
            case: caseDetails,
          },
        };
      }

      case 'add_juror': {
        const jurorData = {
          ...toolInput,
          organizationId: user.organizationId,
          createdBy: user.userId,
        };

        // Remove caseId from jurorData as it will be handled separately
        const { caseId, ...jurorFields } = jurorData;

        const newJuror = await server.prisma.juror.create({
          data: jurorFields,
        });

        // If caseId provided, create jury panel member
        if (caseId) {
          // Find or create a jury panel for this case
          let panel = await server.prisma.juryPanel.findFirst({
            where: {
              caseId,
              organizationId: user.organizationId,
            },
          });

          if (!panel) {
            panel = await server.prisma.juryPanel.create({
              data: {
                caseId,
                organizationId: user.organizationId,
                name: 'Main Panel',
                createdBy: user.userId,
              },
            });
          }

          await server.prisma.juryPanelMember.create({
            data: {
              juryPanelId: panel.id,
              jurorId: newJuror.id,
            },
          });
        }

        return {
          result: {
            success: true,
            juror: newJuror,
            message: `Juror "${newJuror.name}" added successfully${caseId ? ' and assigned to case' : ''}`,
          },
        };
      }

      case 'classify_juror_archetype': {
        // Get juror details
        const juror = await server.prisma.juror.findFirst({
          where: {
            id: toolInput.jurorId,
            organizationId: user.organizationId,
          },
        });

        if (!juror) {
          return {
            result: null,
            error: 'Juror not found',
          };
        }

        // TODO: Call AI archetype classification service
        // For now, return a placeholder response
        return {
          result: {
            success: true,
            message:
              'Archetype classification requires additional juror information. This feature will analyze demographics, background, and questionnaire responses to classify the juror into one of 10 psychological archetypes.',
            jurorId: juror.id,
            jurorName: juror.name,
          },
        };
      }

      default:
        return {
          result: null,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    server.log.error('Tool execution error:', error);
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
