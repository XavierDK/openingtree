import React from 'react'
import {Progress, Popover } from "reactstrap"
import { Table, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import ReportControls from '../ReportControls'
import {Container, Row, Col} from 'reactstrap'
import "react-step-progress-bar/styles.css";
import {trackEvent} from '../../app/Analytics'
import * as Constants from '../../app/Constants'
import { ProgressBar,Step } from "react-step-progress-bar";
import {playerDetails} from './MovesCommon'
import {simplifyCount} from '../../app/util'

export default class MovesTable extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            openPerformanceIndex: null
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if(prevProps.turnColor !== this.props.turnColor) {
            this.setState({
                openPerformanceIndex: null,
            })
        }
    }

    move(san) {
        return () => {
            this.props.onMove(san)
            trackEvent(Constants.EVENT_CATEGORY_MOVES_LIST, this.props.clickedEventName)
        }
    }

    togglePerformancePopover(moveIndex) {
        return (e) => {
            if(this.state.openPerformanceIndex !== null) {
                this.setState({openPerformanceIndex:null})
            } else {
                this.setState({openPerformanceIndex: moveIndex})
            }
            e.stopPropagation()
        }
    }

    compareProgress(currMove){
        let steps = currMove.compareTo
        if(!steps) {
            return null
        }
        return (
            <ProgressBar
              percent={0}
              stepPositions={steps}
            >
                
              <Step transition="scale">
                {({ accomplished }) => (
                  <img onClick = {alert}
                    width="16"
                    height="20"
                    src="./images/arrow-white.png"
                  />
                )}
              </Step>
              <Step transition="scale">
                {({ accomplished }) => (
                  <img
                    style={{ filter: `grayscale(80%)` }}
                    width="14"
                    height="18"
                    src="./images/arrow-black.png"
                  />
                )}
              </Step>
            </ProgressBar>
          )
    }

    getPopover(moveIndex) {
        let performancePopoverOpen = this.state.openPerformanceIndex === moveIndex
        let openMove = this.props.movesToShow[moveIndex]

        return <Popover trigger="hover" placement="right" isOpen={performancePopoverOpen} target={`p${this.props.namespace}${moveIndex}`} toggle={this.togglePerformancePopover(moveIndex)}>
                <ReportControls moveDetails={openMove.details} simplifiedView={true} 
                isOpen = {performancePopoverOpen} launchGame={this.props.launchGame} 
                settings={this.props.settings} reportFooter ={this.reportFooter(moveIndex)}/>
            </Popover>
    }

    reportFooter(moveIndex) {
        let currMove = this.props.movesToShow[moveIndex]

        if(this.getTranspositionWarningLevel(moveIndex)!=='none') {
            return <div>{this.getInfoIcon(moveIndex)}<b> This move has transpositions</b> <div>{currMove.san} has been played only {currMove.moveCount} times but the resulting position has appeared {currMove.details.count} times through other move orders.</div></div>
        }
    }

    getTranspositionWarningLevel(moveIndex){
        let currMove = this.props.movesToShow[moveIndex]
        let targetCount = currMove.details.count
        let difference = targetCount - currMove.moveCount
        if (difference>0) {
            if(difference>10 && difference/targetCount>0.1) {
                return "warning"
            } else {
                return "info"
            }
        }
        return "none"
    }

    render() {
        let hasMoves = (this.props.movesToShow && this.props.movesToShow.length>0)
        return <Table>
            {hasMoves?
        <TableHead>
        <TableRow>
            <TableCell size="small" className="smallCol"><b>Move</b></TableCell>
            <TableCell size="small" className="smallCol"><b>Games</b></TableCell>
            <TableCell><b>Results</b></TableCell>
        </TableRow></TableHead>  
        :null}
        {hasMoves?
        <TableBody>
        {
        this.props.movesToShow.map((move, moveIndex) => {
            let lastPlayedGame = move.details.lastPlayedGame
            return lastPlayedGame && move.moveCount === 1?
                this.getSingleItemRow(move,lastPlayedGame):
                this.getMultiItemRow(move, moveIndex)
                
            }
        )}
    </TableBody>
    :null}
        <TableFooter><TableRow>
            <TableCell colSpan="3">
                {this.props.tableFooter}
            </TableCell>
        </TableRow></TableFooter>
    </Table>
    }
    getMultiItemRow(move, moveIndex) {
        return <TableRow className="moveRow" key = {`m${move.orig}${move.dest}${move.san}`} onClick={this.move(move.san)}>
            <TableCell size="small" className="smallCol">{move.san} </TableCell>
            <TableCell size="small" id={`p${this.props.namespace}${moveIndex}`} className="smallCol" onClick ={this.togglePerformancePopover(moveIndex)}>
                {simplifyCount(move.moveCount)}{this.getInfoIcon(moveIndex)}
                {this.getPopover(moveIndex)}
            </TableCell>
            <TableCell>
                <Container>
                <Row><Col className="navCol">
                <Progress className = "border" multi>
                    <Progress bar className="whiteMove" value={`${this.percentage(move.details.whiteWins,move.details.count)}`}>{this.getProgressLabel(move.details.whiteWins,move.details.count)}</Progress>
                    <Progress bar className="grayMove" value={`${this.percentage(move.details.draws,move.details.count)}`}>{this.getProgressLabel(move.details.draws,move.details.count)}</Progress>
                    <Progress bar className="blackMove" value={`${this.percentage(move.details.blackWins,move.details.count)}`}>{this.getProgressLabel(move.details.blackWins,move.details.count)}</Progress>
                </Progress></Col></Row>
                <Row className="zeroHeight"><Col className="navCol">
                {this.compareProgress(move)}
                </Col></Row>
                </Container>
            </TableCell>
        </TableRow>
    }

    getInfoIcon(moveIndex) {
        if(this.getTranspositionWarningLevel(moveIndex) === "warning"){
            return <FontAwesomeIcon 
                className={`leftPadding redColor lowOpacity`} 
                icon={faExclamationTriangle}/>
        }
        return <FontAwesomeIcon 
            className={`lowOpacity leftPadding`} 
            icon={faInfoCircle}/>

    }

    getProgressLabel(count, total){
        let percentage = this.percentage(count,total)
        if(percentage<10) {
            return ''
        }
        if(this.props.showAsPercentage) {
            return `${percentage.toFixed(1)}%`
        }
        return count

    }

    percentage(count, total){
        return count/total*100
    }
    getSingleItemRow(move,lastPlayedGame) {
        let sampleResultWhite = playerDetails(lastPlayedGame.white, lastPlayedGame.whiteElo)
        let sampleResultBlack = playerDetails(lastPlayedGame.black, lastPlayedGame.blackElo)
        let sampleResult = lastPlayedGame.result

        return <TableRow className="moveRow" key = {`${move.orig}${move.dest}`} onClick={this.move(move.orig, move.dest, move.san)}>
                <TableCell size="small" className="smallCol">{move.san}</TableCell>
                <TableCell colSpan = "2">
                        {sampleResultWhite} {sampleResult} {sampleResultBlack} {<FontAwesomeIcon className="pointerExternalLink" onClick ={this.props.launchGame(move.details.lastPlayedGame)} icon={faExternalLinkAlt}/>}
                </TableCell>
            </TableRow>
    }

}
