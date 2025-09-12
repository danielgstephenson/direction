import torch
import numpy as np
import os

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device = " + str(device))

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
units = torch.arange(unitCount, dtype=torch.int32).to(device)
myUnits = torch.tensor([0,2,4], dtype=torch.int32).to(device)
otherUnits = torch.tensor([1,3,5], dtype=torch.int32).to(device)
maxRound = 48
actionSpace = torch.tensor([0, 1, 2, 3], dtype=torch.int).to(device)
actionCount = 4
actionVecs = torch.tensor([[1,0],[0,1],[-1,0],[0,-1]], dtype=torch.int).to(device)
gridVecs = torch.tensor(
	[[x,y] for x in range(gridSize) for y in range(gridSize)],
	dtype=torch.int
).to(device)
gridCount = gridVecs.size()[0]
gridLocs = torch.tensor([loc for loc in range(gridCount)], dtype=torch.int).to(device)

vecToLoc = torch.zeros((gridSize, gridSize),dtype=torch.int).to(device)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec[0], vec[1]] = loc

shift = torch.zeros((gridCount,actionCount),dtype=torch.int).to(device)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec[0] + actionVec[0], 0, gridSize-1)
		y = clamp(gridVec[1] + actionVec[1], 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def moveToEnd(tensor_1d: torch.Tensor, index: int):
	indices = torch.arange(tensor_1d.size()[0]).to(device)
	matches = torch.where(indices==index,1,0)
	sorted_indices = torch.argsort(matches, stable=True)
	sorted = torch.gather(tensor_1d, 0, sorted_indices)
	return sorted

def stateToLocs(state: torch.Tensor):
	options = gridLocs.clone()
	s = state
	locs = torch.tensor([], dtype=torch.int).to(device)
	for unitIndex in range(unitCount):
		optionCount = gridCount - unitIndex
		i = (s % optionCount).view(1)
		s = (s-i) // optionCount
		locs = torch.cat((locs, options[i]))
		options = moveToEnd(options,i)
	return locs

optionCounts = torch.tensor(
	[gridCount - r for r in range(unitCount)], 
	dtype=torch.int32
).to(device)

stateCount = torch.prod(optionCounts,dtype=torch.int32).to(device)
states = torch.arange(stateCount,dtype=torch.int32).to(device)

coefficients = torch.tensor(
	[torch.prod(optionCounts[0:i]) for i in range(unitCount)],
	dtype=torch.int32
).to(device)

def locsToState (locs: torch.Tensor):
	options = gridLocs.clone()
	total = 0
	for unitIndex in range(unitCount):
		loc = locs[unitIndex]
		matches = (options == loc).long()
		optionIndex = torch.argmax(matches)
		options = moveToEnd(options,optionIndex)
		coefficient = coefficients[unitIndex]
		total += optionIndex * coefficient
	return total.to(dtype=torch.int32)

def isin(x: torch.Tensor, y: torch.Tensor):
	return (x == y.unsqueeze(-1)).any(dim=0)

scoreValues = 100*torch.ones((3,3), dtype=torch.uint8).to(device)
scoreValues[2,:] = 200
scoreValues[:,2] = 0

def getEndValue (goals: torch.Tensor, state: torch.Tensor):
	locs = stateToLocs(state)
	myLocs = locs[myUnits]
	otherLocs = locs[otherUnits]
	myScore = isin(goals,myLocs).sum()
	otherScore = isin(goals,otherLocs).sum()
	return scoreValues[myScore.view(1), otherScore.view(1)].squeeze()

def getEndValues (goals: torch.Tensor, states: torch.Tensor):
	f = torch.vmap(
		getEndValue, 
		in_dims=(None, 0), 
		chunk_size=stateCount // 500
	)
	return f(goals, states)

def getOutcome (state: torch.Tensor, action: torch.Tensor):
	unitLocs = stateToLocs(state)
	#print('start',gridVecs[unitLocs])
	stepLoc = unitLocs[0].clone().view(1)
	pathLocs = torch.tensor([], dtype=torch.int).to(device)
	pathUnits = torch.tensor([], dtype=torch.int).to(device)
	for _ in range(gridSize):
		pathLocs = torch.cat((pathLocs,stepLoc))
		stepLoc = shift[stepLoc.view(1),action.view(1)]
	occupied = isin(pathLocs,unitLocs)
	blocked = torch.all(occupied)
	pushing = torch.cumprod(isin(pathLocs,unitLocs),0).to(torch.bool) 
	movingPath = pushing & ~blocked
	#print('pathLocs',pathLocs)
	movingPathLocs = torch.where(movingPath, pathLocs, -1)
	#print('movingPathLocs',movingPathLocs)
	movingUnits = isin(unitLocs,movingPathLocs)
	shifted = shift[unitLocs, action.view(1)]
	movedUnitLocs = torch.where(movingUnits, shifted, unitLocs)
	cycledUnitLocs = moveToEnd(movedUnitLocs, 0)
	#print('end',gridVecs[cycledUnitLocs])
	outcome = locsToState(cycledUnitLocs)
	return outcome

def getOutcomes(state: torch.Tensor):
	return torch.vmap(getOutcome, in_dims=(None, 0))(state, actionSpace)


endValues = torch.tensor([0,200]).to(device)
valueRange = torch.arange(201).to(device)
invertValue = 200 - valueRange + torch.sign(valueRange-100)
invertValue[99] = 101
invertValue[101] = 99

def getValue(values: torch.Tensor, state: torch.Tensor):
	outcomes = getOutcomes(state)
	nextValues = values[outcomes].to(torch.int)
	inverseNextValues = invertValue[nextValues]
	maxInverseNextValue = torch.max(inverseNextValues)
	oldValue = values[state.view(1)]
	#print('state',state)
	#print('oldValue',oldValue)
	#print('torch.abs(oldValue-100)',torch.abs(oldValue-100))
	endState = isin(oldValue,endValues)
	#print('endState',endState)
	#print('maxInverseNextValue',maxInverseNextValue)
	value = torch.where(endState,oldValue,maxInverseNextValue)
	#print('value',value)
	return value

def getValues(values: torch.Tensor, selected_states=states):
	f = torch.vmap(
		getValue, 
		in_dims = (None, 0), 
		chunk_size = stateCount // 500
	)
	return torch.squeeze(f(values, selected_states))

goals = torch.tensor([12, 13],dtype=torch.int).to(device)
values = getEndValues(goals, states)

values[34312]
getValue(values,states[34312])

values[7139148]
getValue(values,states[7139148])

values[7139140:7139180]
getValues(values, states[7139140:7139180])

for i in range(100):
	print('step '+str(i))
	print(torch.unique(values).cpu().numpy())
	values = getValues(values)
	print('')

values.cpu().numpy().tofile('values.bin')

# os.system('clear')

# Save the values 
