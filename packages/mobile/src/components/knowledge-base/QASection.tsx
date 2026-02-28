/**
 * Q&A Section Component
 * Display Q&A and allow users to ask/answer questions
 * TODO: Implement full functionality as per UI spec
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { askQuestion, answerQuestion, upvoteQuestion, upvoteAnswer } from '../../services/api/knowledge-base-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface QASectionProps {
  articleId: string;
  qaData: any[];
  onRefresh: () => void;
}

export default function QASection({ articleId, qaData, onRefresh }: QASectionProps) {
  const { t } = useLanguage();
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;
    
    try {
      await askQuestion(articleId, questionText);
      setQuestionText('');
      setShowAskQuestion(false);
      onRefresh();
    } catch (error) {
      console.error('Error asking question:', error);
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await upvoteQuestion(questionId);
      onRefresh();
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    try {
      await upvoteAnswer(answerId);
      onRefresh();
    } catch (error) {
      console.error('Error upvoting answer:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.askButton}
        onPress={() => setShowAskQuestion(!showAskQuestion)}
      >
        <Icon name="help-outline" size={20} color="#fff" />
        <Text style={styles.askButtonText}>{t('knowledge_base.ask_question')}</Text>
      </TouchableOpacity>

      {showAskQuestion && (
        <View style={styles.askSection}>
          <TextInput
            style={styles.questionInput}
            placeholder={t('knowledge_base.question_placeholder')}
            value={questionText}
            onChangeText={setQuestionText}
            multiline
            numberOfLines={3}
          />
          <View style={styles.askActions}>
            <TouchableOpacity onPress={() => setShowAskQuestion(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitQuestionButton}
              onPress={handleAskQuestion}
            >
              <Text style={styles.submitQuestionText}>{t('common.submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={qaData}
        keyExtractor={(item) => item.question_id}
        renderItem={({ item }) => {
          const isExpanded = expandedQuestions.has(item.question_id);
          return (
            <View style={styles.questionCard}>
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => toggleQuestion(item.question_id)}
              >
                <TouchableOpacity
                  style={styles.upvoteButton}
                  onPress={() => handleUpvoteQuestion(item.question_id)}
                >
                  <Icon name="arrow-upward" size={16} color="#666" />
                  <Text style={styles.upvoteText}>{item.upvotes}</Text>
                </TouchableOpacity>
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{item.question_text}</Text>
                  <Text style={styles.questionMeta}>
                    {new Date(item.created_at).toLocaleDateString()} • {item.answers?.length || 0} {t('knowledge_base.answers')}
                  </Text>
                </View>
                <Icon
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {isExpanded && item.answers && item.answers.length > 0 && (
                <View style={styles.answersSection}>
                  {item.answers.map((answer: any) => (
                    <View key={answer.answer_id} style={styles.answerCard}>
                      {answer.is_accepted && (
                        <View style={styles.acceptedBadge}>
                          <Icon name="check-circle" size={16} color="#4CAF50" />
                          <Text style={styles.acceptedText}>{t('knowledge_base.accepted')}</Text>
                        </View>
                      )}
                      {answer.is_expert_answer && (
                        <View style={styles.expertBadge}>
                          <Icon name="verified" size={16} color="#2196F3" />
                          <Text style={styles.expertText}>{t('knowledge_base.expert')}</Text>
                        </View>
                      )}
                      <Text style={styles.answerText}>{answer.answer_text}</Text>
                      <View style={styles.answerFooter}>
                        <TouchableOpacity
                          style={styles.upvoteButton}
                          onPress={() => handleUpvoteAnswer(answer.answer_id)}
                        >
                          <Icon name="arrow-upward" size={14} color="#666" />
                          <Text style={styles.upvoteText}>{answer.upvotes}</Text>
                        </TouchableOpacity>
                        <Text style={styles.answerDate}>
                          {new Date(answer.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        scrollEnabled={false}
      />

      {qaData.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="question-answer" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{t('knowledge_base.no_questions')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  askSection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  askActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
    marginRight: 16,
    paddingVertical: 8,
  },
  submitQuestionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitQuestionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  upvoteButton: {
    alignItems: 'center',
    marginRight: 12,
  },
  upvoteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  questionMeta: {
    fontSize: 12,
    color: '#999',
  },
  answersSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  answerCard: {
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 4,
  },
  answerText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  answerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});
