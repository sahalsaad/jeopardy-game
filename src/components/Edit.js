import React, { Component } from 'react';
import { connect } from 'react-redux';
import { hashHistory } from 'react-router';
import {ipcRenderer} from  'electron';

const jeopardyValues = [
  { value: 200 }, { value: 400 }, { value: 600 }, { value: 800 }, { value: 1000 }
];
const doubleJeopardyValues = jeopardyValues.map(valObj => {
  return {value: valObj.value * 2}
});

class Edit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editingQuestion: null,
      currentTab: 'jeopardy',
      game: {
        jeopardy: {
          categories: {
            0: jeopardyValues,
            1: jeopardyValues,
            2: jeopardyValues,
            3: jeopardyValues,
            4: jeopardyValues,
            5: jeopardyValues,
          },
        },
        doubleJeopardy: {
          categories: {
            0: doubleJeopardyValues,
            1: doubleJeopardyValues,
            2: doubleJeopardyValues,
            3: doubleJeopardyValues,
            4: doubleJeopardyValues,
            5: doubleJeopardyValues,
          },
        },
        finalJeopardy: {
          category: '',
          question: '',
          answer: '',
        },
      },
    };

    ipcRenderer.on('open-file-reply', (event, data) => {
      try {
        const gameData = JSON.parse(data.fileContents);
        const jeopardy = {...this.state.game.jeopardy.categories, ...gameData.jeopardy.categories};
        const doubleJeopardy = {...this.state.game.doubleJeopardy.categories, ...gameData.doubleJeopardy.categories};
        const finalJeopardy = { ...this.state.game.finalJeopardy, ...gameData.finalJeopardy };
        this.setState({
          game: {
            jeopardy: {
              categories: {
                ...jeopardy,
              }
            },
            doubleJeopardy: {
              categories: {
                ...doubleJeopardy,
              }
            },
            finalJeopardy: {
              ...finalJeopardy,
            }
          }
        });
      } catch(e) {
        alert('Could not load game. Invalid or corrupt game file.');
      }
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners(['open-file-reply']);
  }

  handleSave = () => {
    console.log(JSON.stringify(this.state.game));
    ipcRenderer.send('save-file-dialog', {data: JSON.stringify(this.state.game)});
  }

  editExisting = () => {
    ipcRenderer.send('open-file-dialog');
  }

  updateCategory = (index, value) => {
    let questions = this.state.game[this.state.currentTab].categories[index].map(question => {
      return {...question, category: value};
    });
    let categories = this.state.game[this.state.currentTab].categories;
    categories[index] = questions;

    this.setState({
      game: {
        ...this.state.game,
        [this.state.currentTab]: {
          ...this.state.game[this.state.currentTab],
          categories: {
            ...this.state.game[this.state.currentTab].categories,
            ...categories
          }
        }
      }
    });
  }

  handleTabSwitch = (currentTab) => {
    if (currentTab != 'finalJeopardy' && this.state.currentTab != 'finalJeopardy') {
      for (let i = 0; i < 6; i++) {
        let category = this.state.game[currentTab].categories[i][0].category;
        this.refs[`categoryInput${i}`].value = category ? category : '';
      }
    }
    this.setState({currentTab});
  }

  editQuestion = (categoryIndex, index) => {
    this.setState({
      editingQuestion: {categoryId: categoryIndex, questionId: index}
    });
  }

  saveQuestion(data) {

    let categories = this.state.game[this.state.currentTab].categories;
    categories[this.state.editingQuestion.categoryId][this.state.editingQuestion.questionId] = data;

    this.setState({
      game: {
        ...this.state.game,
        [this.state.currentTab]: {
          ...this.state.game[this.state.currentTab],
          categories: {
            ...this.state.game[this.state.currentTab].categories,
            ...categories
          }
        }
      }
    }, () => {
      this.setState({editingQuestion: null })
    });
  }

  render() {
    let questionObj, categories;
    if (this.state.editingQuestion && this.state.currentTab != 'finalJeopardy') {
      questionObj = this.state.game[this.state.currentTab].categories[this.state.editingQuestion.categoryId][this.state.editingQuestion.questionId];
    }

    if (this.state.currentTab != 'finalJeopardy') {
      categories = Object.keys(this.state.game[this.state.currentTab].categories).map((categoryId, i) => {
        let categoryName = this.state.game[this.state.currentTab].categories[categoryId].find(cat => {
          return cat.category != '';
        });
        return (
          <div key={i} className='category-section'>
            <input 
                   value={categoryName && categoryName.category || ''}
                   placeholder='Category title'
                   className={categoryName && categoryName.category ? '' : 'blink'}
                   id={'categoryInput' + categoryId}
                   ref={'categoryInput' + categoryId}
                   type='text'
                   onChange={(event) => {this.updateCategory(categoryId, event.target.value)}} />
            <Questions editQuestion={this.editQuestion}
                       categoryIndex={categoryId}
                       questions={this.state.game[this.state.currentTab].categories[categoryId]} />
          </div>
        );
      });
    } else {
      categories = (
        <div>
          <div>
            <input defaultValue={this.state.game.finalJeopardy.category}
                   placeholder='Final Jeopardy category'
                   className={this.state.game.finalJeopardy.category ? this.state.game.finalJeopardy.category : 'blink'}
                   type='text'
                   onChange={
                     (event) => {
                       this.setState({
                         game: {
                           ...this.state.game,
                           finalJeopardy: {
                             ...this.state.game.finalJeopardy,
                             category: event.target.value
                           }
                         }
                       });
                     }
                   } />
          </div>
          <div>
            <textarea defaultValue={this.state.game.finalJeopardy.question}
                      placeholder='Final Jeopardy question'
                      className={this.state.game.finalJeopardy.question ? this.state.game.finalJeopardy.question : 'blink'}
                      style={{height: 50+'px', width: 300+'px'}}
                      onChange={
                        (event) => {
                           this.setState({
                             game: {
                               ...this.state.game,
                               finalJeopardy: {
                                 ...this.state.game.finalJeopardy,
                                 question: event.target.value
                               }
                             }
                           });
                        }
                      } />
          </div>
          <div>
            <input defaultValue={this.state.game.finalJeopardy.answer}
                   placeholder='Final Jeopardy answer'
                   className={this.state.game.finalJeopardy.answer ? this.state.game.finalJeopardy.answer : 'blink'}
                   type='text'
                   onChange={
                     (event) => {
                       this.setState({
                         game: {
                           ...this.state.game,
                           finalJeopardy: {
                             ...this.state.game.finalJeopardy,
                             answer: event.target.value
                           }
                         }
                       });
                     }
                   } />
          </div>
        </div>
      );

    }

    return (
      <div className='edit-screen'>
      {this.state.editingQuestion &&
            <div>
              <h4>{questionObj.category ? questionObj.category : <i>untitled category</i>} -- ${questionObj.value}</h4>
              <div>
                <textarea defaultValue={questionObj.question} style={{height: 50+'px', width: 300+'px'}} id='question' ref='question' placeholder='Question' />
              </div>
              <div>
                <input defaultValue={questionObj.answer} id='answer' ref='answer' type='text' placeholder='Answer' />
              </div>
              <div>
                <input id='youtubeLink' ref='youtubeLink' type='text' placeholder='YouTube link' />
              </div>
              <div>
                <input id='imageLink' ref='imageLink' type='text' placeholder='Image link' />
              </div>
              <button className='cancel' onClick={() => {this.setState({editingQuestion: false}) }}>Cancel</button>
              <button className='start-button'
                      onClick={() => {
                      let data = {
                        value: questionObj.value,
                        category: questionObj.category,
                        question: this.refs.question.value,
                        answer: this.refs.answer.value,
                        youtubeLink: this.refs.youtubeLink.value,
                        imageLink: this.refs.imageLink.value
                      };
                      this.saveQuestion(data);
                    }}>Save Question</button>
            </div>

      }
      {!this.state.editingQuestion &&
            <div>
              <span className='back-button' onClick={() => {hashHistory.push('/')}}>MENU</span>
              <div className='tab-container'>
                <span className='tab'
                      style={this.state.currentTab === 'jeopardy' ? {borderBottom: 5+'px solid #147bce'} : null}
                      onClick={() => {this.handleTabSwitch('jeopardy')}}>
                  Jeopardy
                </span>
                <span className='tab'
                      style={this.state.currentTab === 'doubleJeopardy' ? {borderBottom: 5+'px solid #147bce'} : null}
                      onClick={() => {this.handleTabSwitch('doubleJeopardy')}}>
                  Double Jeopardy
                </span>
                <span className='tab'
                      style={this.state.currentTab === 'finalJeopardy' ? {borderBottom: 5+'px solid #147bce'} : null}
                      onClick={() => {this.handleTabSwitch('finalJeopardy')}}>
                  Final Jeopardy
                </span>
              </div>
              {categories}
              <button  onClick={this.editExisting}>Edit Existing</button>
              <button className='start-button' onClick={this.handleSave}>Save...</button>
            </div>
      }
      </div>
    );
  }
}


export default connect(null, { })(Edit);


const Questions = ({ categoryIndex, questions, editQuestion }) => {
  let vals = questions.map((question, i) => {
    return <span className={question.question && question.answer ? 'edit-question' : 'edit-question blink'}
                 onClick={() => {editQuestion(categoryIndex, i)}}
                 key={i}>
             ${question.value}
             {(question.question && question.answer) ? <span>&nbsp;<i className='fa fa-check' style={{color: '#67d067'}}></i></span> : null }
           </span>
  });
  return (
    <div className='question-buttons'>
      {vals}
    </div>
  );
}
