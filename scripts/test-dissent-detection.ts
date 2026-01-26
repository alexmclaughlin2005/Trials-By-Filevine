/**
 * Test script to verify dissent detection is working
 * Run with: npx tsx scripts/test-dissent-detection.ts
 */

import { ConversationPosition } from '../services/api-gateway/src/services/roundtable/turn-manager';

// Mock Statement type
interface Statement {
  personaId: string;
  personaName: string;
  content: string;
  sequenceNumber: number;
  sentiment?: string;
  keyPoints?: string[];
  position?: ConversationPosition;
}

// Simple TurnManager mock focusing on dissent detection
class DissentTester {
  private conversationHistory: Statement[] = [];
  private currentDissent: any = null;

  recordStatement(statement: Statement): void {
    this.conversationHistory.push(statement);

    // Detect dissent
    const dissentInfo = this.detectDissent(statement);
    if (dissentInfo.isPresent) {
      console.log(`\n🚨 [DISSENT] ${statement.personaName} took contrarian position: ${this.assessStatementPosition(statement)} vs consensus ${this.assessConsensusPosition()}`);
      this.currentDissent = dissentInfo;
    } else {
      console.log(`✓ ${statement.personaName}: ${this.assessStatementPosition(statement)} (consensus: ${this.assessConsensusPosition()})`);
    }
  }

  private assessConsensusPosition(): ConversationPosition {
    if (this.conversationHistory.length < 3) {
      return ConversationPosition.NEUTRAL;
    }

    const recentStatements = this.conversationHistory.slice(-5);
    const positions = recentStatements
      .map(s => this.assessStatementPosition(s))
      .filter(p => p !== ConversationPosition.NEUTRAL);

    if (positions.length === 0) {
      return ConversationPosition.NEUTRAL;
    }

    const plaintiffCount = positions.filter(p => p === ConversationPosition.PLAINTIFF).length;
    const defenseCount = positions.filter(p => p === ConversationPosition.DEFENSE).length;

    const threshold = positions.length * 0.66;

    if (plaintiffCount >= threshold) {
      return ConversationPosition.PLAINTIFF;
    } else if (defenseCount >= threshold) {
      return ConversationPosition.DEFENSE;
    }

    return ConversationPosition.NEUTRAL;
  }

  private assessStatementPosition(statement: Statement): ConversationPosition {
    if (statement.position) {
      return statement.position;
    }

    // Check sentiment if available
    const sentiment = statement.sentiment?.toLowerCase();
    if (sentiment === 'plaintiff_leaning') {
      return ConversationPosition.PLAINTIFF;
    } else if (sentiment === 'defense_leaning') {
      return ConversationPosition.DEFENSE;
    }

    // Fallback: Use key points analysis
    if (statement.keyPoints && statement.keyPoints.length > 0) {
      const keyPointsText = statement.keyPoints.join(' ').toLowerCase();

      const plaintiffSignals = ['plaintiff', 'victim', 'injured', 'harm', 'damages', 'suffering',
                                'negligent', 'responsible', 'fault', 'liability'];
      const defenseSignals = ['defendant', 'not liable', 'no evidence', 'innocent', 'accident',
                              'not responsible', 'contributory', 'assumption of risk'];

      const plaintiffCount = plaintiffSignals.filter(signal => keyPointsText.includes(signal)).length;
      const defenseCount = defenseSignals.filter(signal => keyPointsText.includes(signal)).length;

      if (plaintiffCount > defenseCount && plaintiffCount >= 2) {
        return ConversationPosition.PLAINTIFF;
      } else if (defenseCount > plaintiffCount && defenseCount >= 2) {
        return ConversationPosition.DEFENSE;
      }
    }

    return ConversationPosition.NEUTRAL;
  }

  private detectDissent(statement: Statement): any {
    const consensus = this.assessConsensusPosition();

    if (consensus === ConversationPosition.NEUTRAL) {
      return { isPresent: false, speakersRequiredToEngage: 0 };
    }

    const statementPosition = this.assessStatementPosition(statement);

    const isDissent = statementPosition !== ConversationPosition.NEUTRAL &&
                      statementPosition !== consensus;

    if (isDissent) {
      return {
        isPresent: true,
        dissenterPersonaId: statement.personaId,
        dissenterPersonaName: statement.personaName,
        dissentStatement: statement.content,
        dissentKeyPoints: statement.keyPoints || [],
        speakersRequiredToEngage: 2
      };
    }

    return { isPresent: false, speakersRequiredToEngage: 0 };
  }
}

// Test scenarios
console.log('=== Testing Dissent Detection ===\n');

console.log('--- Scenario 1: Consensus forms, then dissent ---\n');
const tester1 = new DissentTester();

// Build plaintiff consensus
tester1.recordStatement({
  personaId: '1',
  personaName: 'Alice',
  content: 'The plaintiff was clearly harmed',
  sequenceNumber: 1,
  keyPoints: ['plaintiff injured', 'clear harm', 'negligent defendant']
});

tester1.recordStatement({
  personaId: '2',
  personaName: 'Bob',
  content: 'I agree, the damages are substantial',
  sequenceNumber: 2,
  keyPoints: ['substantial damages', 'plaintiff suffered', 'liability clear']
});

tester1.recordStatement({
  personaId: '3',
  personaName: 'Carol',
  content: 'The defendant was clearly at fault',
  sequenceNumber: 3,
  keyPoints: ['defendant at fault', 'plaintiff victim', 'responsible for harm']
});

tester1.recordStatement({
  personaId: '4',
  personaName: 'Dave',
  content: 'The evidence shows negligence',
  sequenceNumber: 4,
  keyPoints: ['evidence of negligence', 'plaintiff harmed', 'defendant liable']
});

// Now add dissent
tester1.recordStatement({
  personaId: '5',
  personaName: 'Eve',
  content: 'Wait, the defendant has a valid defense here',
  sequenceNumber: 5,
  keyPoints: ['defendant not liable', 'no evidence of fault', 'innocent party']
});

console.log('\n--- Scenario 2: Using sentiment values (post-analysis) ---\n');
const tester2 = new DissentTester();

tester2.recordStatement({
  personaId: '1',
  personaName: 'Frank',
  content: 'Statement 1',
  sequenceNumber: 1,
  sentiment: 'plaintiff_leaning'
});

tester2.recordStatement({
  personaId: '2',
  personaName: 'Grace',
  content: 'Statement 2',
  sequenceNumber: 2,
  sentiment: 'plaintiff_leaning'
});

tester2.recordStatement({
  personaId: '3',
  personaName: 'Henry',
  content: 'Statement 3',
  sequenceNumber: 3,
  sentiment: 'plaintiff_leaning'
});

tester2.recordStatement({
  personaId: '4',
  personaName: 'Iris',
  content: 'Statement 4',
  sequenceNumber: 4,
  sentiment: 'plaintiff_leaning'
});

// Dissent with sentiment
tester2.recordStatement({
  personaId: '5',
  personaName: 'Jack',
  content: 'I disagree completely',
  sequenceNumber: 5,
  sentiment: 'defense_leaning'
});

console.log('\n--- Scenario 3: No dissent (agreement continues) ---\n');
const tester3 = new DissentTester();

tester3.recordStatement({
  personaId: '1',
  personaName: 'Kate',
  content: 'Plaintiff case is strong',
  sequenceNumber: 1,
  keyPoints: ['plaintiff harmed', 'damages clear']
});

tester3.recordStatement({
  personaId: '2',
  personaName: 'Leo',
  content: 'Yes, very strong evidence',
  sequenceNumber: 2,
  keyPoints: ['strong evidence', 'plaintiff victim']
});

tester3.recordStatement({
  personaId: '3',
  personaName: 'Mia',
  content: 'I completely agree',
  sequenceNumber: 3,
  keyPoints: ['plaintiff injured', 'defendant liable']
});

tester3.recordStatement({
  personaId: '4',
  personaName: 'Noah',
  content: 'The liability is clear',
  sequenceNumber: 4,
  keyPoints: ['clear liability', 'defendant at fault']
});

tester3.recordStatement({
  personaId: '5',
  personaName: 'Olivia',
  content: 'Absolutely, no question about it',
  sequenceNumber: 5,
  keyPoints: ['plaintiff harmed', 'defendant responsible']
});

console.log('\n=== Test Complete ===');
console.log('\nExpected results:');
console.log('- Scenario 1: Should detect DISSENT when Eve opposes plaintiff consensus');
console.log('- Scenario 2: Should detect DISSENT when Jack (defense_leaning) opposes plaintiff consensus');
console.log('- Scenario 3: Should NOT detect dissent (all agree with plaintiff position)');
